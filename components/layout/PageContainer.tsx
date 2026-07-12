export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 pb-20 w-full max-w-[1400px] mx-auto">
      <div className="mt-0">
        {children}
      </div>
    </div>
  );
}
