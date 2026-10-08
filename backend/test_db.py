from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:admin@localhost:3306/internship_tracker')
with engine.connect() as conn:
    res = conn.execute(text('SELECT COUNT(*) FROM user')).scalar()
    print('Users in MySQL:', res)
