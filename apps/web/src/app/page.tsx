import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="text-center">
        <div className="mb-6 text-6xl">🧪</div>
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900">
          Ponylab
        </h1>
        <p className="mb-8 max-w-md text-lg text-gray-600">
          AI-Native Laboratory Information Management System.
          <br />
          Experiments, samples, inventory, protocols — all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>

      <div className="mt-16 grid max-w-4xl grid-cols-1 gap-6 px-4 md:grid-cols-3">
        <FeatureCard
          icon="📓"
          title="Electronic Lab Notebook"
          description="Rich text experiment records with version control and digital signatures"
        />
        <FeatureCard
          icon="🧬"
          title="Sample Management"
          description="Track samples from creation to disposal with full chain-of-custody"
        />
        <FeatureCard
          icon="🤖"
          title="AI-Powered Insights"
          description="Smart search, protocol suggestions, and data analysis with Claude AI"
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
