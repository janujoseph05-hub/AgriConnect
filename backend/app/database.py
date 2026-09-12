import sqlite3
from datetime import datetime, timezone
from pathlib import Path


DATABASE_PATH = Path(__file__).resolve().parent.parent / "agriconnect.db"


def get_connection():
    """Open a SQLite connection configured to return rows as dictionaries."""
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database():
    """Create application tables when they do not already exist."""
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS produce_listings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                crop_name TEXT NOT NULL,
                quantity REAL NOT NULL,
                unit TEXT NOT NULL,
                location TEXT NOT NULL,
                farmer_name TEXT NOT NULL,
                expected_price REAL,
                available_from TEXT,
                description TEXT
            )
            """
        )
        listing_count = connection.execute(
            "SELECT COUNT(*) FROM produce_listings"
        ).fetchone()[0]
        if listing_count == 0:
            connection.executemany(
                """
                INSERT INTO produce_listings (
                    crop_name,
                    quantity,
                    unit,
                    location,
                    farmer_name,
                    expected_price,
                    available_from,
                    description
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        "Tomato",
                        50,
                        "kg",
                        "Kanyakumari",
                        "Demo Farmer",
                        40,
                        "2026-09-15",
                        "Fresh, carefully sorted tomatoes from a local farm in Kanyakumari.",
                    ),
                    (
                        "Banana",
                        100,
                        "kg",
                        "Nagercoil",
                        "Demo Farmer",
                        35,
                        "2026-09-18",
                        "Naturally ripened banana bunches, sourced directly from the farm.",
                    ),
                    (
                        "Onion",
                        75,
                        "kg",
                        "Marthandam",
                        "Demo Farmer",
                        45,
                        "2026-09-20",
                        "Firm red onions with a good shelf life, ready for bulk sourcing.",
                    ),
                ],
            )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TEXT,
                location TEXT
            )
            """
        )
        user_columns = {
            row[1] for row in connection.execute("PRAGMA table_info(users)").fetchall()
        }
        if "location" not in user_columns:
            connection.execute("ALTER TABLE users ADD COLUMN location TEXT")
        listing_columns = {
            row[1] for row in connection.execute("PRAGMA table_info(produce_listings)").fetchall()
        }
        if "farmer_id" not in listing_columns:
            connection.execute(
                "ALTER TABLE produce_listings ADD COLUMN farmer_id INTEGER REFERENCES users(id)"
            )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS fpo_farmers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fpo_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                joined_at TEXT,
                UNIQUE(fpo_id, farmer_id)
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS fpo_produce (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fpo_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                crop_name TEXT NOT NULL,
                quantity REAL NOT NULL,
                unit TEXT NOT NULL,
                location TEXT,
                expected_price REAL,
                available_from TEXT,
                description TEXT,
                created_at TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS purchase_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                listing_id INTEGER NOT NULL,
                listing_source TEXT NOT NULL CHECK (listing_source IN ('farmer', 'fpo')),
                farmer_id INTEGER REFERENCES users(id),
                fpo_id INTEGER REFERENCES users(id),
                crop_name TEXT NOT NULL,
                requested_quantity REAL NOT NULL CHECK (requested_quantity > 0),
                unit TEXT NOT NULL,
                offered_price REAL CHECK (offered_price IS NULL OR offered_price >= 0),
                message TEXT,
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
                created_at TEXT,
                updated_at TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS deliveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                purchase_request_id INTEGER NOT NULL UNIQUE REFERENCES purchase_requests(id) ON DELETE CASCADE,
                buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                seller_type TEXT NOT NULL CHECK (seller_type IN ('farmer', 'fpo')),
                seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                crop_name TEXT NOT NULL,
                quantity REAL NOT NULL CHECK (quantity > 0),
                unit TEXT NOT NULL,
                pickup_location TEXT,
                destination TEXT,
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pickup_scheduled', 'in_transit', 'delivered', 'cancelled')),
                distance REAL,
                eta TEXT,
                created_at TEXT,
                updated_at TEXT
            )
            """
        )


def create_user(name, email, password_hash, role, location=None):
    """Create a user and return its safe fields."""
    created_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO users (name, email, password_hash, role, created_at, location)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (name, email, password_hash, role, created_at, location),
        )
        user_id = cursor.lastrowid
    return get_user_by_id(user_id)


def get_user_by_id(user_id):
    """Return a user without its password hash."""
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, name, email, role, created_at, location FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    return dict(row) if row else None


def get_user_auth_record(email):
    """Return the private authentication fields for one email address."""
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, name, email, password_hash, role, created_at, location FROM users WHERE email = ?",
            (email,),
        ).fetchone()
    return dict(row) if row else None


def get_user_by_id_with_role(user_id):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, name, email, role, location FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    return dict(row) if row else None


def get_farmer_by_email(email):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, name, email, role FROM users WHERE email = ?",
            (email.lower(),),
        ).fetchone()
    return dict(row) if row else None


def get_all_listings():
    """Return all produce listings, ordered by newest first."""
    with get_connection() as connection:
        rows = connection.execute(
            """
                 SELECT id, crop_name, quantity, unit, location, farmer_name,
                   expected_price, available_from, description,
                     'farmer' AS source_type, farmer_name AS source_name, farmer_id
            FROM produce_listings
            UNION ALL
                 SELECT -p.id, p.crop_name, p.quantity, p.unit, p.location,
                   u.name AS farmer_name, p.expected_price, p.available_from,
                     p.description, 'fpo' AS source_type, u.name AS source_name, NULL AS farmer_id
            FROM fpo_produce p
            JOIN users u ON u.id = p.fpo_id
            ORDER BY id DESC
            """
        ).fetchall()
    return [dict(row) for row in rows]


def get_listing_by_id(listing_id):
    """Return one listing by ID, or None when it does not exist."""
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM produce_listings WHERE id = ?",
            (listing_id,),
        ).fetchone()
    return dict(row) if row else None


def create_listing(
    crop_name,
    quantity,
    unit,
    location,
    farmer_name,
    expected_price=None,
    available_from=None,
    description=None,
    farmer_id=None,
):
    """Create a listing and return the newly created row."""
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO produce_listings (
                crop_name,
                quantity,
                unit,
                location,
                farmer_name,
                expected_price,
                available_from,
                description,
                farmer_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                crop_name,
                quantity,
                unit,
                location,
                farmer_name,
                expected_price,
                available_from,
                description,
                farmer_id,
            ),
        )
        listing_id = cursor.lastrowid
    return get_listing_by_id(listing_id)


def update_listing(
    listing_id,
    crop_name,
    quantity,
    unit,
    location,
    farmer_name,
    expected_price=None,
    available_from=None,
    description=None,
):
    """Update a listing and return it, or None when the ID does not exist."""
    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE produce_listings
            SET crop_name = ?,
                quantity = ?,
                unit = ?,
                location = ?,
                farmer_name = ?,
                expected_price = ?,
                available_from = ?,
                description = ?
            WHERE id = ?
            """,
            (
                crop_name,
                quantity,
                unit,
                location,
                farmer_name,
                expected_price,
                available_from,
                description,
                listing_id,
            ),
        )
        updated = cursor.rowcount > 0
    return get_listing_by_id(listing_id) if updated else None


def delete_listing(listing_id):
    """Delete a listing and return True when a row was deleted."""
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM produce_listings WHERE id = ?",
            (listing_id,),
        )
    return cursor.rowcount > 0


def get_market_listing(listing_id):
    """Resolve a public marketplace ID to one owned source listing."""
    with get_connection() as connection:
        if listing_id < 0:
            row = connection.execute(
                """
                SELECT -p.id AS listing_id, p.crop_name, p.quantity, p.unit,
                       p.expected_price, p.location, p.fpo_id, u.name AS seller_name,
                       'fpo' AS listing_source
                FROM fpo_produce p JOIN users u ON u.id = p.fpo_id
                WHERE p.id = ?
                """,
                (-listing_id,),
            ).fetchone()
        else:
            row = connection.execute(
                """
                SELECT p.id AS listing_id, p.crop_name, p.quantity, p.unit,
                       p.expected_price, p.location, p.farmer_id, p.farmer_name AS seller_name,
                       'farmer' AS listing_source
                FROM produce_listings p
                WHERE p.id = ?
                """,
                (listing_id,),
            ).fetchone()
    return dict(row) if row else None


def create_purchase_request(buyer_id, listing, requested_quantity, offered_price, message):
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO purchase_requests (
                buyer_id, listing_id, listing_source, farmer_id, fpo_id,
                crop_name, requested_quantity, unit, offered_price, message,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                buyer_id, listing["listing_id"], listing["listing_source"],
                listing.get("farmer_id"), listing.get("fpo_id"),
                listing["crop_name"], requested_quantity, listing["unit"],
                offered_price, message, now, now,
            ),
        )
        request_id = cursor.lastrowid
    return get_purchase_request(request_id)


def _purchase_select(where_clause="", parameters=()):
    with get_connection() as connection:
        rows = connection.execute(
            f"""
            SELECT r.*, b.name AS buyer_name, b.email AS buyer_email,
                   COALESCE(f.name, fp.name) AS seller_name,
                   COALESCE(f.email, fp.email) AS seller_email,
                   CASE WHEN r.listing_source = 'fpo' THEN 'FPO' ELSE 'Farmer' END AS seller_type
            FROM purchase_requests r
            JOIN users b ON b.id = r.buyer_id
            LEFT JOIN users f ON f.id = r.farmer_id
            LEFT JOIN users fp ON fp.id = r.fpo_id
            {where_clause}
            ORDER BY r.created_at DESC, r.id DESC
            """,
            parameters,
        ).fetchall()
    return [dict(row) for row in rows]


def get_purchase_request(request_id):
    rows = _purchase_select("WHERE r.id = ?", (request_id,))
    return rows[0] if rows else None


def list_buyer_purchase_requests(buyer_id):
    return _purchase_select("WHERE r.buyer_id = ?", (buyer_id,))


def list_received_purchase_requests(user_id, role):
    owner_column = "r.fpo_id" if role == "fpo" else "r.farmer_id"
    return _purchase_select(f"WHERE {owner_column} = ?", (user_id,))


def change_purchase_status(request_id, status):
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM purchase_requests WHERE id = ?",
            (request_id,),
        ).fetchone()
        if row is None:
            return None
        request = dict(row)
        if status == "accepted":
            if request["listing_source"] == "fpo":
                table_id = -request["listing_id"]
                current = connection.execute("SELECT quantity FROM fpo_produce WHERE id = ?", (table_id,)).fetchone()
                if current is None or current[0] < request["requested_quantity"]:
                    raise ValueError("The requested quantity is no longer available.")
                connection.execute("UPDATE fpo_produce SET quantity = quantity - ? WHERE id = ?", (request["requested_quantity"], table_id))
            else:
                current = connection.execute("SELECT quantity FROM produce_listings WHERE id = ?", (request["listing_id"],)).fetchone()
                if current is None or current[0] < request["requested_quantity"]:
                    raise ValueError("The requested quantity is no longer available.")
                connection.execute("UPDATE produce_listings SET quantity = quantity - ? WHERE id = ?", (request["requested_quantity"], request["listing_id"]))
            buyer = connection.execute("SELECT location FROM users WHERE id = ?", (request["buyer_id"],)).fetchone()
            seller_location = connection.execute(
                "SELECT location FROM fpo_produce WHERE id = ?" if request["listing_source"] == "fpo" else "SELECT location FROM produce_listings WHERE id = ?",
                (abs(request["listing_id"]),),
            ).fetchone()
            connection.execute(
                """
                INSERT OR IGNORE INTO deliveries (
                    purchase_request_id, buyer_id, seller_type, seller_id,
                    crop_name, quantity, unit, pickup_location, destination,
                    status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
                """,
                (
                    request_id, request["buyer_id"], request["listing_source"],
                    request["fpo_id"] if request["listing_source"] == "fpo" else request["farmer_id"],
                    request["crop_name"], request["requested_quantity"], request["unit"],
                    seller_location[0] if seller_location else None,
                    buyer[0] if buyer and buyer[0] else "Location not provided",
                    now, now,
                ),
            )
        connection.execute(
            "UPDATE purchase_requests SET status = ?, updated_at = ? WHERE id = ?",
            (status, now, request_id),
        )
    return get_purchase_request(request_id)


def _delivery_select(where_clause="", parameters=()):
    with get_connection() as connection:
        rows = connection.execute(
            f"""
            SELECT d.*, b.name AS buyer_name, b.email AS buyer_email,
                   s.name AS seller_name
            FROM deliveries d
            JOIN users b ON b.id = d.buyer_id
            JOIN users s ON s.id = d.seller_id
            {where_clause}
            ORDER BY d.created_at DESC, d.id DESC
            """,
            parameters,
        ).fetchall()
    return [dict(row) for row in rows]


def list_deliveries_for_user(user_id, role):
    if role == "buyer":
        return _delivery_select("WHERE d.buyer_id = ?", (user_id,))
    return _delivery_select("WHERE d.seller_id = ? AND d.seller_type = ?", (user_id, role))


def get_delivery(delivery_id):
    rows = _delivery_select("WHERE d.id = ?", (delivery_id,))
    return rows[0] if rows else None


def update_delivery_status(delivery_id, status):
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as connection:
        cursor = connection.execute(
            "UPDATE deliveries SET status = ?, updated_at = ? WHERE id = ?",
            (status, now, delivery_id),
        )
    return get_delivery(delivery_id) if cursor.rowcount else None


def list_fpo_farmers(fpo_id):
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT u.id, u.name, u.email, f.joined_at, 'Active' AS status
            FROM fpo_farmers f
            JOIN users u ON u.id = f.farmer_id
            WHERE f.fpo_id = ?
            ORDER BY f.joined_at DESC, u.name
            """,
            (fpo_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def add_fpo_farmer(fpo_id, farmer_id):
    joined_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as connection:
        cursor = connection.execute(
            "INSERT INTO fpo_farmers (fpo_id, farmer_id, joined_at) VALUES (?, ?, ?)",
            (fpo_id, farmer_id, joined_at),
        )
        association_id = cursor.lastrowid
    return association_id


def remove_fpo_farmer(fpo_id, farmer_id):
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM fpo_farmers WHERE fpo_id = ? AND farmer_id = ?",
            (fpo_id, farmer_id),
        )
    return cursor.rowcount > 0


def is_fpo_farmer_associated(fpo_id, farmer_id):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT 1 FROM fpo_farmers WHERE fpo_id = ? AND farmer_id = ?",
            (fpo_id, farmer_id),
        ).fetchone()
    return row is not None


def list_fpo_produce(fpo_id):
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM fpo_produce WHERE fpo_id = ? ORDER BY created_at DESC, id DESC",
            (fpo_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def get_fpo_produce(fpo_id, produce_id):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM fpo_produce WHERE fpo_id = ? AND id = ?",
            (fpo_id, produce_id),
        ).fetchone()
    return dict(row) if row else None


def create_fpo_produce(fpo_id, crop_name, quantity, unit, location, expected_price, available_from, description):
    created_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO fpo_produce (
                fpo_id, crop_name, quantity, unit, location, expected_price,
                available_from, description, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (fpo_id, crop_name, quantity, unit, location, expected_price, available_from, description, created_at),
        )
        produce_id = cursor.lastrowid
    return get_fpo_produce(fpo_id, produce_id)


def update_fpo_produce(fpo_id, produce_id, crop_name, quantity, unit, location, expected_price, available_from, description):
    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE fpo_produce
            SET crop_name = ?, quantity = ?, unit = ?, location = ?, expected_price = ?,
                available_from = ?, description = ?
            WHERE fpo_id = ? AND id = ?
            """,
            (crop_name, quantity, unit, location, expected_price, available_from, description, fpo_id, produce_id),
        )
    return get_fpo_produce(fpo_id, produce_id) if cursor.rowcount else None


def delete_fpo_produce(fpo_id, produce_id):
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM fpo_produce WHERE fpo_id = ? AND id = ?",
            (fpo_id, produce_id),
        )
    return cursor.rowcount > 0


def get_fpo_stats(fpo_id):
    with get_connection() as connection:
        stats = connection.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM fpo_farmers WHERE fpo_id = ?) AS total_farmers,
                COALESCE((SELECT SUM(quantity) FROM fpo_produce WHERE fpo_id = ?), 0) AS total_produce_quantity,
                (SELECT COUNT(*) FROM fpo_produce WHERE fpo_id = ? AND quantity > 0) AS active_produce_listings,
                (SELECT COUNT(DISTINCT crop_name) FROM fpo_produce WHERE fpo_id = ?) AS number_of_crops
            """,
            (fpo_id, fpo_id, fpo_id, fpo_id),
        ).fetchone()
    return dict(stats)


initialize_database()
