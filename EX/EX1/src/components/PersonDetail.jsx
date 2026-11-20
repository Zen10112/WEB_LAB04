import React from 'react';

export default function PersonDetail({ person }) {
  return (
    <dl>
      <dt>Họ và tên</dt>
      <dd>{person.name}</dd>
      <dt>Vai trò</dt>
      <dd>{person.role}</dd>
    </dl>
  );
}
