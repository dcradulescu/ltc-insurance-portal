import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/Layout";
import { LTCAcademyPlayer } from "@/components/LTCAcademyPlayer";

export default function Academy() {
  return (
    <Layout>
      <Helmet>
        <title>LTC Academy — Video Series on Long-Term Care Insurance | SC Visiting Angels</title>
        <meta name="description" content="Master long-term care insurance with our comprehensive video academy series. Learn about policies, claims, benefits, and more." />
        <meta property="og:title" content="LTC Academy — Comprehensive Video Education" />
        <meta property="og:description" content="Free video series teaching you everything about long-term care insurance and how to navigate the claims process." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LTC Academy — Video Series on Long-Term Care Insurance" />
        <meta name="twitter:description" content="Master long-term care insurance with our comprehensive video academy series." />
      </Helmet>

      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-100 py-8 md:py-12">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#1B3A5C", fontFamily: "Aptos, sans-serif" }}>
              Welcome to LTC Academy
            </h1>
            <p className="text-lg text-gray-700 leading-relaxed" style={{ fontFamily: "Aptos, sans-serif" }}>
              Learn everything you need to know about long-term care insurance. Our comprehensive video series breaks down complex topics into easy-to-understand lessons, covering policy basics, the claims process, and strategies to maximize your benefits.
            </p>
          </div>
        </div>
      </section>

      <div id="academy-content">
        <LTCAcademyPlayer />
      </div>
    </Layout>
  );
}
