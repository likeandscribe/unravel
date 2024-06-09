import { listRecords } from "./blog-data";

export default async function Blog() {
  const recordsList = await listRecords();
  return (
    <>
      <h1>Blog</h1>
      <ul>
        {recordsList.map((record) => (
          <li key={record.cid}>{record.value.content}</li>
        ))}
      </ul>
    </>
  );
}
