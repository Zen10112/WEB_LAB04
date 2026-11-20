import { NavLink, Outlet, useLocation, useMatch } from 'react-router';
import { findPersonByRouteId } from '../data/people.js';
import './people-layout.css';

export default function PeopleLayout({ people }) {
  const { pathname } = useLocation();
  const match = useMatch('/people/:id');
  const currentPerson = findPersonByRouteId(people, match?.params.id);

  return (
    <>
      <h1>Danh bạ</h1>
      <div className="people-layout">
        <nav className="people-sidebar" aria-labelledby="people-list-heading">
          <h2 id="people-list-heading">Danh sách</h2>
          <ul>
            {people.map((person) => (
              <li key={person.id}>
                <NavLink
                  to={person === currentPerson ? pathname : `/people/${person.id}`}
                  caseSensitive
                  end
                >
                  <span>{person.name}</span>
                  <span className="people-current-label" aria-hidden="true">Đang xem</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <section className="people-detail" aria-label="Chi tiết hồ sơ">
          <Outlet />
        </section>
      </div>
    </>
  );
}
