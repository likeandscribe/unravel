interface Props {
  params: { id: string };
}

export default function BlogPost({ params: { id } }: Props) {
  return <h1>Blog Post {id}</h1>;
}
