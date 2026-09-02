export const erMesh = build2(
  { id: "er-mesh", topic: "多対多が 2 組 / 8 表 8 関係" },
  [
    { id: "roles", title: "roles", subtitle: "役割", cols: [{ name: "id", type: "bigint", pk: true }, { name: "name", type: "text" }] },
    { id: "users", title: "users", subtitle: "利用者", cols: [{ name: "id", type: "bigint", pk: true }, { name: "email", type: "text" }] },
    { id: "teams", title: "teams", subtitle: "組", cols: [{ name: "id", type: "bigint", pk: true }, { name: "name", type: "text" }] },
    { id: "tags", title: "tags", subtitle: "札", cols: [{ name: "id", type: "bigint", pk: true }, { name: "name", type: "text" }] },
    { id: "projects", title: "projects", subtitle: "案件", cols: [{ name: "id", type: "bigint", pk: true }, { name: "team_id", type: "bigint", fk: true }, { name: "owner_id", type: "bigint", fk: true }] },
    { id: "user_roles", title: "user_roles", subtitle: "役割の割当", cols: [{ name: "user_id", type: "bigint", pk: true, fk: true }, { name: "role_id", type: "bigint", pk: true, fk: true }] },
    { id: "team_members", title: "team_members", subtitle: "組の一員", cols: [{ name: "team_id", type: "bigint", pk: true, fk: true }, { name: "user_id", type: "bigint", pk: true, fk: true }] },
    { id: "project_tags", title: "project_tags", subtitle: "案件の札", cols: [{ name: "project_id", type: "bigint", pk: true, fk: true }, { name: "tag_id", type: "bigint", pk: true, fk: true }] },
  ],
  [
    { from: "users", to: "user_roles", label: "持つ", tail: "one", head: "many" },
    { from: "roles", to: "user_roles", label: "割り当てる", tail: "one", head: "many" },
    { from: "users", to: "team_members", label: "入る", tail: "one", head: "many" },
    { from: "teams", to: "team_members", label: "集める", tail: "one", head: "many" },
    { from: "teams", to: "projects", label: "抱える", dashed: true, tail: "one", head: "zero-many" },
    { from: "projects", to: "project_tags", label: "付ける", tail: "one", head: "many" },
    { from: "tags", to: "project_tags", label: "貼る", tail: "one", head: "many" },
    { from: "users", to: "projects", label: "受け持つ", dashed: true, tail: "one", head: "zero-many" },
  ],
  { roles: [0, 0], users: [0, 1], teams: [0, 2], tags: [0, 3], projects: [1, 0], user_roles: [1, 1], team_members: [1, 2], project_tags: [2, 0] },
);
