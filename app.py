from flask import Flask, render_template, redirect, request, session, url_for
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
import sqlite3
from helpers import login_required
import os

app = Flask(__name__)

# -------------------------------
# Session Configuration
# -------------------------------
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# -------------------------------
# Initialize DB from schema.sql (first run)
# -------------------------------
def initialize_db():
    """
    Create manifestation.db from schema.sql if it does not exist yet.
    """
    if not os.path.exists("manifestation.db"):
        print("manifestation.db not found. Creating it now...")
        conn = sqlite3.connect("manifestation.db")
        with open("schema.sql", "r") as f:
            conn.executescript(f.read())
        conn.close()
        print("Database created from schema.sql!")
    else:
        print("Database already exists. Skipping initialization.")


initialize_db()

# -------------------------------
# Database connection helper
# -------------------------------
def get_db():
    """
    Return a SQLite connection with row access by name and
    foreign-key enforcement turned on.
    """
    conn = sqlite3.connect("manifestation.db", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enforce foreign keys for this connection (matches PRAGMA in schema.sql)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


db = get_db()

# -------------------------------
# Routes
# -------------------------------

@app.route("/")
def index():
    # If user is already logged in, send them straight to dashboard
    if session.get("user_id"):
        return redirect(url_for("dashboard"))
    return render_template("index.html")


# -------------------------------
# Registration & Login
# -------------------------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirmation = request.form.get("confirmation")

        errors = []

        # Basic validation
        if not username:
            errors.append("Must provide username.")
        if not password:
            errors.append("Must provide password.")
        if not confirmation:
            errors.append("Must confirm password.")
        if password and confirmation and password != confirmation:
            errors.append("Passwords must match.")

        # If any validation errors, re-render template with errors
        if errors:
            return render_template(
                "register.html",
                errors=errors,
                username=username
            ), 400

        hash_pw = generate_password_hash(password)

        try:
            db.execute(
                "INSERT INTO users (username, hash) VALUES (?, ?)",
                (username, hash_pw),
            )
            db.commit()
        except Exception:
            # Most likely a UNIQUE constraint failure on username
            return render_template(
                "register.html",
                error="Username already exists",
                username=username
            ), 400

        # Log the user in after successful registration
        user = db.execute(
            "SELECT id FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        session["user_id"] = user["id"]

        return redirect(url_for("dashboard"))

    # GET: just show the registration page
    return render_template("register.html")



@app.route("/login", methods=["GET", "POST"])
def login():
    # Forget any user_id
    session.clear()

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        # If either field is missing, re-render login with an error
        if not username or not password:
            return render_template(
                "login.html",
                error="Must provide username and password"
            ), 400

        user = db.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,),
        ).fetchone()

        # If user doesn't exist or password is wrong, re-render login with error
        if not user or not check_password_hash(user["hash"], password):
            return render_template(
                "login.html",
                error="Invalid username or password"
            ), 403

        # Successful login
        session["user_id"] = user["id"]
        return redirect(url_for("dashboard"))

    # GET: just show the login page
    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))


# -------------------------------
# Dashboard (Home summary view)
# -------------------------------
@app.route("/dashboard")
@login_required
def dashboard():
    user_id = session["user_id"]

    # Total manifestations
    total_manifests_row = db.execute(
        "SELECT COUNT(*) AS c FROM manifestations WHERE user_id = ?",
        (user_id,),
    ).fetchone()
    total_manifests = total_manifests_row["c"] if total_manifests_row else 0

    # Total synchronicities
    total_synch_row = db.execute(
        "SELECT COUNT(*) AS c FROM synchronicities WHERE user_id = ?",
        (user_id,),
    ).fetchone()
    total_synchronicities = total_synch_row["c"] if total_synch_row else 0

    # Activity in the last 7 days (manifestations + synchronicities)
    recent_activity_row = db.execute(
        """
        SELECT COUNT(*) AS c
        FROM (
            SELECT date AS ts
            FROM manifestations
            WHERE user_id = ?
            UNION ALL
            SELECT created_at AS ts
            FROM synchronicities
            WHERE user_id = ?
        )
        WHERE DATE(ts) >= DATE('now', '-6 days')
        """,
        (user_id, user_id),
    ).fetchone()
    recent_activity_count = recent_activity_row["c"] if recent_activity_row else 0

    # Recent manifestations (3 most recent)
    recent_manifests = db.execute(
        """
        SELECT
            id,
            title,
            category,
            emotion,
            date AS created_at
        FROM manifestations
        WHERE user_id = ?
        ORDER BY date DESC
        LIMIT 3
        """,
        (user_id,),
    ).fetchall()

    # Recent synchronicities (3 most recent)
    recent_synchronicities = db.execute(
        """
        SELECT
            id,
            title,
            category,
            created_at
        FROM synchronicities
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 3
        """,
        (user_id,),
    ).fetchall()

    # Last logged entry across both tables
    last_log_row = db.execute(
        """
        SELECT MAX(ts) AS last_ts
        FROM (
            SELECT date AS ts
            FROM manifestations
            WHERE user_id = ?
            UNION ALL
            SELECT created_at AS ts
            FROM synchronicities
            WHERE user_id = ?
        )
        """,
        (user_id, user_id),
    ).fetchone()
    last_log = last_log_row["last_ts"] if last_log_row else None

    return render_template(
        "dashboard.html",
        total_manifests=total_manifests,
        total_synchronicities=total_synchronicities,
        recent_activity_count=recent_activity_count,
        recent_manifests=recent_manifests,
        recent_synchronicities=recent_synchronicities,
        last_log=last_log,
    )


# -------------------------------
# Journal (Manifestations)
# -------------------------------
@app.route("/journal")
@login_required
def journal():
    user_id = session["user_id"]

    # Split manifestations by status so the template stays simple
    active_entries = db.execute(
        """
        SELECT *
        FROM manifestations
        WHERE user_id = ?
          AND (status IS NULL OR status = 'active')
        ORDER BY date DESC
        """,
        (user_id,),
    ).fetchall()

    manifested_entries = db.execute(
        """
        SELECT *
        FROM manifestations
        WHERE user_id = ?
          AND status = 'manifested'
        ORDER BY
            completed_at DESC,
            date DESC
        """,
        (user_id,),
    ).fetchall()

    abandoned_entries = db.execute(
        """
        SELECT *
        FROM manifestations
        WHERE user_id = ?
          AND status = 'abandoned'
        ORDER BY date DESC
        """,
        (user_id,),
    ).fetchall()

    return render_template(
        "journal.html",
        active_entries=active_entries,
        manifested_entries=manifested_entries,
        abandoned_entries=abandoned_entries,
    )



# -------------------------------
# Manifestation Detail & Lifecycle
# -------------------------------
@app.route("/manifestations/<int:manifestation_id>")
@login_required
def manifestation_detail(manifestation_id):
    """Show a single manifestation and its linked synchronicities."""
    user_id = session["user_id"]

    manifestation = db.execute(
        "SELECT * FROM manifestations WHERE id = ? AND user_id = ?",
        (manifestation_id, user_id),
    ).fetchone()

    if not manifestation:
        return "Manifestation not found or unauthorized", 404

    # All synchronicities linked to this manifestation
    synchronicities = db.execute(
        """
        SELECT *
        FROM synchronicities
        WHERE user_id = ? AND manifestation_id = ?
        ORDER BY created_at ASC
        """,
        (user_id, manifestation_id),
    ).fetchall()

    return render_template(
        "manifestation_detail.html",
        manifestation=manifestation,
        synchronicities=synchronicities,
    )


@app.route("/manifestations/<int:manifestation_id>/complete", methods=["POST"])
@login_required
def complete_manifestation(manifestation_id):
    """Mark a manifestation as manifested and optionally save an outcome/reflection."""
    user_id = session["user_id"]
    outcome_text = request.form.get("outcome_text")

    db.execute(
        """
        UPDATE manifestations
        SET status = 'manifested',
            outcome_text = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
        """,
        (outcome_text, manifestation_id, user_id),
    )
    db.commit()

    return redirect(url_for("manifestation_detail", manifestation_id=manifestation_id))


# -------------------------------
# Add Manifestation
# -------------------------------
@app.route("/add_manifestation", methods=["GET", "POST"])
@login_required
def add_manifestation():
    if request.method == "POST":
        title = request.form.get("title")
        entry_text = request.form.get("entry_text")
        category = request.form.get("category")
        emotion = request.form.get("emotion")
        keywords = request.form.get("keywords")

        if not title or not entry_text:
            return "Title and Entry are required", 400

        db.execute(
            """
            INSERT INTO manifestations
                (user_id, title, entry_text, category, emotion, keywords)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (session["user_id"], title, entry_text, category, emotion, keywords),
        )
        db.commit()
        return redirect(url_for("journal"))

    return render_template("add_manifestation.html")


@app.route("/journal/delete/<int:entry_id>", methods=["POST"])
@login_required
def delete_journal(entry_id):
    entry = db.execute(
        "SELECT * FROM manifestations WHERE id = ? AND user_id = ?",
        (entry_id, session["user_id"]),
    ).fetchone()

    if not entry:
        return "Entry not found or unauthorized", 404

    db.execute(
        "DELETE FROM manifestations WHERE id = ?",
        (entry_id,),
    )
    db.commit()
    return redirect(url_for("journal"))


# -------------------------------
# Synchronicities
# -------------------------------
@app.route("/synchronicities")
@login_required
def synchronicities():
    synchros = db.execute(
        "SELECT * FROM synchronicities WHERE user_id = ? ORDER BY created_at DESC",
        (session["user_id"],),
    ).fetchall()
    return render_template("synchronicities.html", synchronicities=synchros)


# Scoped: add a synchronicity for a specific manifestation
@app.route("/manifestations/<int:manifestation_id>/add_synchronicity", methods=["GET", "POST"])
@login_required
def add_synchronicity_for_manifestation(manifestation_id):
    user_id = session["user_id"]

    manifestation = db.execute(
        "SELECT id, title FROM manifestations WHERE id = ? AND user_id = ?",
        (manifestation_id, user_id),
    ).fetchone()

    if not manifestation:
        return "Manifestation not found or unauthorized", 404

    if request.method == "POST":
        title = request.form.get("title")
        description = request.form.get("description")
        category = request.form.get("category")

        if not title or not description:
            return "Title and Description are required", 400

        db.execute(
            """
            INSERT INTO synchronicities
                (user_id, title, description, category, manifestation_id)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, title, description, category, manifestation_id),
        )
        db.commit()
        return redirect(url_for("manifestation_detail", manifestation_id=manifestation_id))

    # Reuse the same template, but pass the bound manifestation so the UI can hide the dropdown
    return render_template(
        "add_synchronicity.html",
        manifestation=manifestation,
        active_manifestations=None,
        selected_manifestation_id=manifestation_id,
    )


@app.route("/add_synchronicity", methods=["GET", "POST"])
@login_required
def add_synchronicity():
    user_id = session["user_id"]

    # Allow manifest ID via querystring (GET) or form (POST)
    manifestation_id = request.args.get("manifestation_id") or request.form.get("manifestation_id")
    try:
        manifestation_id = int(manifestation_id) if manifestation_id else None
    except ValueError:
        manifestation_id = None

    if request.method == "POST":
        title = request.form.get("title")
        description = request.form.get("description")
        category = request.form.get("category")

        # Re-parse manifestation_id from form to be safe
        manifest_from_form = request.form.get("manifestation_id")
        try:
            manifestation_id = int(manifest_from_form) if manifest_from_form else None
        except ValueError:
            manifestation_id = None

        if not title or not description:
            return "Title and Description are required", 400

        db.execute(
            """
            INSERT INTO synchronicities
                (user_id, title, description, category, manifestation_id)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, title, description, category, manifestation_id),
        )
        db.commit()

        if manifestation_id:
            return redirect(url_for("manifestation_detail", manifestation_id=manifestation_id))
        return redirect(url_for("synchronicities"))

    # GET: show dropdown of active manifestations (or all if you prefer)
    active_manifestations = db.execute(
        """
        SELECT id, title
        FROM manifestations
        WHERE user_id = ?
          AND (status IS NULL OR status = 'active')
        ORDER BY date DESC
        """,
        (user_id,),
    ).fetchall()

    return render_template(
        "add_synchronicity.html",
        active_manifestations=active_manifestations,
        selected_manifestation_id=manifestation_id,
        manifestation=None,
    )


@app.route("/delete_synchronicity/<int:synch_id>", methods=["POST"])
@login_required
def delete_synchronicity(synch_id):
    db.execute(
        "DELETE FROM synchronicities WHERE id = ? AND user_id = ?",
        (synch_id, session["user_id"]),
    )
    db.commit()
    return redirect(url_for("synchronicities"))


# -------------------------------
# Analytics
# -------------------------------
from flask import abort  # make sure this is in your imports

@app.route("/analytics")
@login_required
def analytics():
    user_id = session["user_id"]

    # 1) Total synchronicities
    total_row = db.execute(
        "SELECT COUNT(*) AS total FROM synchronicities WHERE user_id = ?",
        (user_id,),
    ).fetchone()
    total = total_row["total"] if total_row else 0

    # 2) Most common category
    most_common_row = db.execute(
        """
        SELECT category, COUNT(*) AS count
        FROM synchronicities
        WHERE user_id = ?
          AND category IS NOT NULL
          AND TRIM(category) <> ''
        GROUP BY category
        ORDER BY count DESC
        LIMIT 1
        """,
        (user_id,),
    ).fetchone()
    most_common_category = most_common_row["category"] if most_common_row else None

    # 3) 7-day streak: distinct days with at least one synchronicity
    streak_row = db.execute(
        """
        SELECT COUNT(DISTINCT DATE(created_at)) AS days
        FROM synchronicities
        WHERE user_id = ?
          AND DATE(created_at) >= DATE('now', '-6 days')
        """,
        (user_id,),
    ).fetchone()
    streak = streak_row["days"] if streak_row else 0

    # 4) Recent synchros for the timeline (limit 20)
    synchros = db.execute(
        """
        SELECT id, title, description, category, created_at
        FROM synchronicities
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 20
        """,
        (user_id,),
    ).fetchall()

    return render_template(
        "analytics.html",
        total=total,
        most_common_category=most_common_category,
        streak=streak,
        synchros=synchros,
    )


# -------------------------------
# Synchronicity detail view
# -------------------------------
@app.route("/synchronicity/<int:synch_id>")
@login_required
def synchronicity_detail(synch_id):
    user_id = session["user_id"]

    synch = db.execute(
        """
        SELECT id, title, description, category, created_at
        FROM synchronicities
        WHERE id = ? AND user_id = ?
        """,
        (synch_id, user_id),
    ).fetchone()

    if synch is None:
        abort(404)

    return render_template("synchronicity_detail.html", synch=synch)


# -------------------------------
# Visualization
# -------------------------------
@app.route("/visualization")
@login_required
def visualization():
    user_id = session["user_id"]
    cards = db.execute(
        "SELECT * FROM visualization WHERE user_id = ?",
        (user_id,)
    ).fetchall()
    return render_template("visualization.html", cards=cards)

@app.route("/visualization/add", methods=["POST"])
@login_required
def add_visualization_card():
    user_id = session["user_id"]
    title = request.form.get("title")
    image_url = request.form.get("image_url")

    if not title:
        return "Title is required", 400

    db.execute(
        """
        INSERT INTO visualization (user_id, title, image_url)
        VALUES (?, ?, ?)
        """,
        (user_id, title, image_url)
    )
    db.commit()

    return redirect(url_for("visualization"))

# -------------------------------
# Visualization Update
# -------------------------------
@app.route("/visualization/update/<int:card_id>", methods=["POST"])
@login_required
def update_visualization_card(card_id):
    user_id = session["user_id"]

    data = request.get_json(silent=True) or {}
    x = data.get("x_position")
    y = data.get("y_position")
    scale = data.get("scale", 1)
    rotation = data.get("rotation", 0)

    if x is None or y is None:
        return "Invalid position", 400

    db.execute(
        """
        UPDATE visualization
        SET x_position = ?, y_position = ?, scale = ?, rotation = ?
        WHERE id = ? AND user_id = ?
        """,
        (x, y, scale, rotation, card_id, user_id),
    )
    db.commit()

    return ("", 204)

# -------------------------------
# Visualization Delete
# -------------------------------
@app.route("/visualization/delete/<int:card_id>", methods=["POST"])
@login_required
def delete_visualization_card(card_id):
    user_id = session["user_id"]

    db.execute(
        "DELETE FROM visualization WHERE id = ? AND user_id = ?",
        (card_id, user_id),
    )
    db.commit()

    return ("", 204)


if __name__ == "__main__":
    app.run(debug=True)
