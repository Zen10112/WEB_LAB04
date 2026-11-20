import { NavLink, Outlet, useMatch } from 'react-router';
import './people-layout.css';

export default function PeopleLayout({ people }) {
  const currentId = useMatch('/people/:id')?.params.id;

  return (
    <>
      <h1>Danh bạ</h1>
      <div className="people-layout">
        <nav className="people-sidebar" aria-labelledby="people-list-heading">
          <h2 id="people-list-heading">Danh sách</h2>
          <ul>
            {people.map((person) => {
              // Match numeric deep links without changing the other link URLs.
              const numericId = String(person.numericId);
              const linkId = currentId === numericId ? numericId : person.id;

              return (
                <li key={person.id}>
                  <NavLink to={`/people/${linkId}`} end>
                    <span>{person.name}</span>
                    <span className="people-current-label" aria-hidden="true">Đang xem</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <section className="people-detail" aria-label="Chi tiết hồ sơ">
          <Outlet />
        </section>
      </div>
    </>
  );
}
