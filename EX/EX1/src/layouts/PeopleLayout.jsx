import { NavLink, Outlet } from 'react-router';
import './people-layout.css';

export default function PeopleLayout({ people }) {
  return (
    <>
      <h1>Danh bạ</h1>
      <div className="people-layout">
        <nav className="people-sidebar" aria-labelledby="people-list-heading">
          <h2 id="people-list-heading">Danh sách</h2>
          <ul>
            {people.map((person) => (
              <li key={person.id}>
                <NavLink to={`/people/${person.id}`} end>
                  {person.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="people-detail">
          <Outlet />
        </div>
      </div>
    </>
  );
}
