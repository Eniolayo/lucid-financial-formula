import FinancialModel from "@/components/financial-model";

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-2xl font-bold mb-6">Financial Model</h1>
        <FinancialModel />
      </div>
    </main>
  );
}
