import { listRecords } from "./blog-data";

export default async function Blog() {
  const recordsList = await listRecords();
  return (
    <>
      <h1>Blog</h1>
      <ul>
        {recordsList.map((r) => (
          <li key={r.cid}>{r.value.content}</li>
        ))}
      </ul>
    </>
  );
}
