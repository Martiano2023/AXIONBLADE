export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-[#0a0a1a] min-h-screen">{children}</div>;
}
