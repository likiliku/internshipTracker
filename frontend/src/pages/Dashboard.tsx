import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Briefcase, Clock, CheckCircle, Brain, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';



function Stat({ label, value, icon: Icon, color }: { label: string, value: any, icon: any, color: string }) {
  return (
    <article className="stat">
      <span className={color}><Icon size={21} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const [apps, setApps] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/applications').then(r => setApps(r.data));
    api.get('/api/ai/recommendations').then(r => setRecs(r.data.slice(0, 3))).catch(() => { });
  }, []);

  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">YOUR CAREER COMMAND CENTER</span>
          <h1>Turn ambition into<br /><i>real momentum.</i></h1>
          <p>Discover opportunities, see exactly where you stand, and build the skills the market needs.</p>
          <Link className="primary" to="/internships">Explore internships <ArrowRight size={17} /></Link>
        </div>
        <div className="hero-card">
          <Brain size={35} />
          <b>AI-guided search</b>
          <p>Matches are based on your profile—not a prediction of selection.</p>
        </div>
      </section>

      <section className="stats">
        <Stat label="Total Applications" value={apps.length} icon={Briefcase} color="blue" />
        <Stat label="Saved" value={apps.filter(x => x.status === 'Saved').length} icon={Clock} color="purple" />
        <Stat label="Applied" value={apps.filter(x => x.status === 'Applied').length} icon={Clock} color="orange" />
        <Stat label="Interview" value={apps.filter(x => x.status === 'Interview').length} icon={CheckCircle} color="green" />
        <Stat label="Selected" value={apps.filter(x => x.status === 'Selected').length} icon={CheckCircle} color="green" />
        <Stat label="Rejected" value={apps.filter(x => x.status === 'Rejected').length} icon={CheckCircle} color="red" />
      </section>

      <section className="section-head">
        <div>
          <span className="eyebrow">PERSONALIZED FOR YOU</span>
          <h2>Strong matches this week</h2>
        </div>
        <Link to="/student/recommendations">View all</Link>
      </section>
      
      <div className="cards">
        {recs.length ? recs.map(x => (
          <article className="internship" key={x.internship_id}>
            <div className="card-top">
              <div>
                <h3>{x.title}</h3>
                <p>{x.company}</p>
              </div>
              <b className="score">{x.match_score}% match</b>
            </div>
            <p>{x.reason}</p>
            <Link to={'/internships/' + x.internship_id}>View opportunity <ArrowRight size={15} /></Link>
          </article>
        )) : <div className="empty">Complete your profile to receive AI matches.</div>}
      </div>
    </>
  );
}
