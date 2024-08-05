import { redirect } from "next/navigation";

export function AtUriForm({
  defaultUri,
  style,
}: {
  defaultUri?: string;
  style?: React.CSSProperties;
}) {
  return (
    <form
      action={async (formData) => {
        "use server";
        const uri = formData.get("uri") as string;
        redirect(`/at/${uri}`);
      }}
      style={{ ...style, display: "flex" }}
    >
      <input
        style={{ flexGrow: 1 }}
        type="text"
        name="uri"
        defaultValue={defaultUri}
      />
      <button type="submit">Go</button>
    </form>
  );
}
