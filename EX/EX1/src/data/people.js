export const samplePerson = { name: 'Nguyễn Minh Anh', role: 'Sinh viên' };

export const people = [
  { id: 'minh-anh', numericId: 1, ...samplePerson },
  { id: 'bao-tran', numericId: 2, name: 'Trần Bảo Trân', role: 'Sinh viên' },
  { id: 'duc-huy', numericId: 3, name: 'Lê Đức Huy', role: 'Trợ giảng' },
];

export function findPersonByRouteId(people, id) {
  return people.find((person) => person.id === id || String(person.numericId) === id);
}
