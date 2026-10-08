from app.database.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text('ALTER TABLE internships MODIFY external_id VARCHAR(500);'))
    conn.commit()
print("Table altered!")
