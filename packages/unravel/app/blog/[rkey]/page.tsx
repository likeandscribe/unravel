import Markdown from "@/lib/markdown";
import { getBlog } from "../blog-data";

interface Props {
  params: { rkey: string };
}

export default async function BlogPost({ params: { rkey } }: Props) {
  const blog = await getBlog(rkey);

  return (
    <>
      <h1 className="text-4xl mb-8 mt-32">{blog.value.title}</h1>
      <div>
        <Markdown
          content={blog.value.content}
          components={{
            h2: (props) => <h2 className="text-2xl mt-8 mb-4" {...props} />,
            p: (props) => <p className="mb-4" {...props} />,
            a: (props) => (
              <a
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                {...props}
              />
            ),
          }}
        />
      </div>
    </>
  );
}
