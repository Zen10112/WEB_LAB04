import { Link, Route, Routes, useParams } from 'react-router';
import App from './App.jsx';
import { findPersonByRouteId, people } from './data/people.js';
import SimpleForm from './form/SimpleForm';
import MainLayout from './layouts/MainLayout.jsx';
import PeopleLayout from './layouts/PeopleLayout.jsx';
import NotFound from './pages/NotFound.jsx';

function Home() {
  return (
    <>
      <h1>Trang chủ</h1>
      <ul>
        <li><Link to="/people">Xem thông tin cá nhân</Link></li>
        <li><Link to="/form">Mở biểu mẫu liên hệ</Link></li>
      </ul>
    </>
  );
}

function ContactPage() {
  return (
    <>
      <h1>Biểu mẫu liên hệ</h1>
      <SimpleForm />
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

function NotFoundState() {
  return (
    <div role="alert">
      <h2>404 – Không tìm thấy người này</h2>
    </div>
  );
}

function PeopleDetailRoute() {
  const { id } = useParams();
  const person = findPersonByRouteId(people, id);

  return person ? <App key={person.id} person={person} /> : <NotFoundState />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="form" element={<ContactPage />} />
        <Route path="people" element={<PeopleLayout people={people} />}>
          <Route index element={<PeopleIndex />} />
          <Route path=":id" element={<PeopleDetailRoute />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
