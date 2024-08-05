import { navigateUri } from "./actions";

export function AtUriForm({
  defaultUri,
  style,
}: {
  defaultUri?: string;
  style?: React.CSSProperties;
}) {
  return (
    <form action={navigateUri} style={{ ...style, display: "flex" }}>
      <input
        style={{ flexGrow: 1 }}
        type="text"
        name="uri"
        key={defaultUri}
        defaultValue={defaultUri}
      />
      <button type="submit">Go</button>
    </form>
  );
}
