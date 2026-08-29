/**
 * Internal prototypes. They inherit no product chrome. The founder-approved Learn & Build
 * entry may link here from the product shell without moving this route into `(app)`.
 */
export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
