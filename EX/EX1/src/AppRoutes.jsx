import { Link, Route, Routes, useParams } from 'react-router';
import App from './App.jsx';
import { people } from './data/people.js';
import MainLayout from './layouts/MainLayout.jsx';
import PeopleLayout from './layouts/PeopleLayout.jsx';
import NotFound from './pages/NotFound.jsx';

function Home() {
  return (
    <>
      <h1>Trang chủ</h1>
      <Link to="/people">Xem thông tin cá nhân</Link>
    </>
  );
}

function PeopleIndex() {
  return (
    <>
      <h2>Thông tin cá nhân</h2>
      <p>Chọn một người trong danh sách để xem chi tiết.</p>
    </>
  );
}

function PeopleDetailRoute() {
  const { id } = useParams();
  const person = people.find((entry) => entry.id === id);

  return person ? <App key={person.id} person={person} /> : <h2>Không tìm thấy người này</h2>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="people" element={<PeopleLayout people={people} />}>
          <Route index element={<PeopleIndex />} />
          <Route path=":id" element={<PeopleDetailRoute />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
