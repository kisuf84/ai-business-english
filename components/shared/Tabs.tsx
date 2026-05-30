type TabsProps = {
  children: React.ReactNode;
};

export default function Tabs({ children }: TabsProps) {
  return <div className="tabs max-w-full flex-wrap">{children}</div>;
}
