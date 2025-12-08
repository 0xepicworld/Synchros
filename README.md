# Synchros – Intention & Synchronicity Tracker

**Video Demo:** (https://youtu.be/ojBYOTnr7a8)
**GitHub Repository:** _(if applicable)_

## Description

Synchros is a web application built as my CS50 final project. It is an **intention and synchronicity tracker**: a digital space where users can write down their intentions (similar to goals, manifestations, or scripts), and log meaningful “signs” or coincidences they experience along the way. The project aims to bring structure and clarity to what is usually a very abstract process—paying attention to patterns in your life.

The app combines three main pieces of functionality:

1. A **journal of intentions**, where each intention has a title, a script/body, an optional category, an associated emotion, and optional keywords.
2. A **synchronicity log**, where users can record events, signs, or coincidences and optionally link them to a specific intention.
3. An **analytics and visualization layer** that gives the user a bird’s-eye view of their patterns via simple statistics and a drag-and-drop vision board.

In practice, a user creates intentions such as “I land a new client” or “I improve my health,” then logs synchronicities like repeated numbers, chance encounters, conversations, or dreams that feel relevant. Over time, the user can see how many synchronicities show up, which categories are most common, and how active their practice has been recently.

The app is deliberately opinionated in its wording: instead of “manifestations,” I chose to use “intentions” everywhere in the user interface. This language feels more grounded and accessible while still supporting users who like to think in terms of manifestation or reality creation.

Synchros is built with **Flask** and **SQLite**, using Jinja2 templates, custom CSS, and a small amount of JavaScript. It supports user registration and login with password hashing, and keeps all user data isolated per account.

## File Overview

### `app.py`

This is the core of the application. It:

- Initializes the SQLite database (creating `manifestation.db` from `schema.sql` if necessary).
- Manages a single database connection with `row_factory` enabled and foreign key support turned on.
- Defines all routes, including:

  - `"/"` – public landing page.
  - `"/register"` – registration form and user creation.
  - `"/login"` / `"/logout"` – authentication.
  - `"/dashboard"` – logged-in overview of counts and recent activity.
  - `"/journal"` – listing of active, manifested, and abandoned intentions.
  - `"/add_manifestation"` – form to create a new intention.
  - `"/manifestation/<int:manifestation_id>"` – detail page for a single intention, including its script, metadata, and a timeline of related synchronicities.
  - `"/complete_manifestation/<int:manifestation_id>"` – marks an intention as fulfilled and optionally stores an outcome reflection.
  - `"/delete_manifestation/<int:manifestation_id>"` – deletes an intention.
  - `"/synchronicities"` – list of all synchronicities for the user.
  - `"/add_synchronicity"` and `"/manifestation/<id>/add_synchronicity"` – global and intention-specific synchronicity logging.
  - `"/delete_synchronicity/<int:synch_id>"` and `"/synchronicity/<int:synch_id>"` – deletion and detail view for single synchronicities.
  - `"/analytics"` – shows total synchronicities, most common category, a 7-day streak, and a timeline of entries.
  - `"/visualization"` and associated `/visualization/add`, `/visualization/update/<id>`, and `/visualization/delete/<id>` routes – manage the vision board.

`app.py` is where most of the project’s logic lives: querying, inserting, and updating rows; preparing data for the templates; and handling form submissions and JSON-based updates for the visualization board.

### `helpers.py`

Contains the `login_required` decorator, which wraps routes that should only be accessible if a user is logged in. It checks for a `user_id` in `session` and redirects to the login page if the user is not authenticated. This keeps access control centralized and readable, instead of repeating checks inside every route.

### `schema.sql`

Defines the database schema:

- `users`: stores `id`, `username`, and a hashed password.
- `manifestations`: stores intentions with fields such as `user_id`, `title`, `entry_text`, `category`, `emotion`, `keywords`, `status` (active / manifested / abandoned), an optional `outcome_text`, and timestamps.
- `synchronicities`: stores synchronicity entries linked to a user, and optionally linked to a specific `manifestation_id` with `ON DELETE SET NULL`.
- `visualization`: stores vision board cards with `title`, optional `image_url`, and numeric fields for `x_position`, `y_position`, `scale`, and `rotation`.

Design choice: I chose to use SQLite and a fairly normalized schema with foreign keys. This keeps the data model clean and makes it easier to query things like all synchronicities for a specific intention, or all entries for a user. For a CS50-scale app, SQLite is lightweight, embedded, and more than sufficient.

### `requirements.txt`

Lists the Python dependencies, including Flask and Werkzeug (used for password hashing). This file allows the environment to be reproduced quickly with `pip install -r requirements.txt`.

### Templates (`templates/*.html`)

All HTML files extend a shared `layout.html`, which defines the neon-themed sidebar and main content structure.

- `layout.html`: Base layout with the left navigation, app name, and conditionally rendered navigation items depending on whether the user is logged in.
- `index.html`: Public landing page that introduces Synchros and links to login/register.
- `login.html`, `register.html`: Authentication forms with error message support.
- `dashboard.html`: Displays top stats, recent intentions, and recent synchronicities.
- `journal.html`: Shows active intentions on one side and fulfilled/archived intentions on the other.
- `add_manifestation.html`: Form to create a new intention.
- `manifestation_detail.html`: Detail page for one intention, including the status summary, the intention script, metadata, and a timeline of related synchronicities.
- `synchronicities.html`: List all synchronicities with delete actions.
- `add_synchronicity.html`: Form to log a synchronicity, either globally or tied to a specific intention.
- `synchronicity_detail.html`: Shows a single synchronicity’s details.
- `analytics.html`: Displays statistics and a timeline of all synchronicities.
- `visualization.html`: Vision board interface with a form to add cards and a draggable area for arranging them.

### `static/styles.css`

Defines the visual identity of the app: a dark background with neon highlights, cards, grids, buttons, timeline styles, and responsive layout. A design choice here was to keep everything in a single CSS file and avoid using frameworks like Bootstrap. This gave me full control over the look and feel and forced me to practice writing modern CSS, including flexbox and grid layouts.

## Design Choices and Tradeoffs

Some key design decisions were debated during development:

- **Flask + SQLite vs. heavier stacks**: I chose Flask and SQLite because they are simple, well-documented, and ideal for a single-developer project. Using a heavier framework or an external database would add setup complexity without clear benefit at this scale.
- **Separate intentions and synchronicities**: Another option would have been a single “event” table with types. I chose separate tables with a foreign key from `synchronicities` to `manifestations` because conceptually they are different entities. This separation simplifies queries like “all synchronicities for this intention.”
- **Timeline and analytics scope**: Instead of building complex charts, I kept the analytics text-based and number-based. This is enough to demonstrate the concept and avoids additional JavaScript libraries.
- **Visualization board implementation**: I implemented drag-and-drop with vanilla JavaScript and CSS transforms rather than importing a big front-end library. This choice kept the project lightweight and helped me understand how to work directly with `DOMMatrixReadOnly`, event listeners, and `fetch`.

Overall, Synchros is meant to feel like a focused, opinionated tool rather than a generic CRUD app. It expresses a specific idea: that tracking your inner intentions and perceived outer signs can help you notice patterns and feel more engaged with your life.

This project is built from scratch as my final project for CS50, and it was built using the utilization of ChatGPT 5.1 Thinking

Thankyou CS50!
