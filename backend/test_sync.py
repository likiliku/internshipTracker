import asyncio
from app.database.session import SessionLocal
from app.models import Internship, PostingStatus
from sqlalchemy import select
from app.services.job_providers.adzuna_service import AdzunaProvider
from app.services.job_providers.remotive_service import RemotiveProvider
from app.services.job_providers.jsearch_service import JSearchProvider
from app.services.job_providers.jooble_service import JoobleProvider

async def run():
    try:
        adzuna = AdzunaProvider()
        remotive = RemotiveProvider()
        jsearch = JSearchProvider()
        jooble = JoobleProvider()
        adzuna_res, remotive_res, jsearch_res, jooble_res = await asyncio.gather(
            adzuna.search_jobs('Software', '', 1, 25),
            remotive.search_jobs('Software', '', 1, 25),
            jsearch.search_jobs('Software', '', 1, 25),
            jooble.search_jobs('Software', '', 1, 25)
        )
        results = adzuna_res + remotive_res + jsearch_res + jooble_res
        
        db = SessionLocal()
        added = 0
        for values in results:
            existing = db.scalar(select(Internship).where(Internship.source==values['source'], Internship.external_id==values['external_id']))
            if not existing:
                values['status'] = PostingStatus.APPROVED
                db.add(Internship(**values))
                added += 1
        db.commit()
        print('Success added', added)
    except Exception as e:
        import traceback; traceback.print_exc()

asyncio.run(run())
