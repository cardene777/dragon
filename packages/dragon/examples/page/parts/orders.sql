create table orders (
  id text primary key,
  address text not null,
  taken_at timestamp not null
);

create table order_items (
  order_id text not null references orders (id),
  name text not null,
  count integer not null check (count > 0)
);
