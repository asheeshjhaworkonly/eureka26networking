"use client";
import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import {
  ArrowDown,
  ArrowUpRight,
  Search,
  QrCode,
  Users,
  MoveUpRight,
  Plus,
  Check,
} from "lucide-react";
export default function Landing() {
  return (
    <main className="container landing">
      <div className="eyebrow">
        <span className="live-dot" /> EUREKA! 2026 · ZONAL NETWORK
      </div>
      <section className="landing-hero">
        <div>
          <h1>
            The chat moves on.
            <br />
            <span className="highlight">Your connections</span>
            <br />
            shouldn’t.
          </h1>
          <p className="intro">
            You made it to the zonals. Now meet the people building alongside
            you. One shared directory. Three cities. A whole lot of possibility.
          </p>
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/directory">
              <button className="button yellow">
                Find your people <ArrowUpRight size={22} />
              </button>
            </SignInButton>
            <p className="fine">
              Sign in with Google to explore and create your profile.
            </p>
          </Show>
          <Show when="signed-in">
            <Link className="button yellow" href="/directory">
              Find your people <ArrowUpRight size={22} />
            </Link>
          </Show>
        </div>
        <div
          className="network-art"
          aria-label="One network connecting the three zonal cities"
        >
          <div className="art-label">YOUR NEXT CONNECTION IS HERE ↗</div>
          <div className="art-card orange">
            <span>01 / MUMBAI</span>
            <h2>
              Big ideas.
              <br />
              Bigger hellos.
            </h2>
            <MoveUpRight size={64} />
          </div>
          <div className="art-card lavender">
            <span>02 / DELHI</span>
            <Users size={54} />
            <strong>
              BUILD SOMETHING.
              <br />
              MEET SOMEONE.
            </strong>
          </div>
          <div className="art-card mint">
            <QrCode size={62} />
            <div>
              <span>03 / BENGALURU</span>
              <strong>
                Scan. Connect.
                <br />
                Stay in touch.
              </strong>
            </div>
          </div>
          <span className="art-star">✳</span>
          <div className="art-sticker">
            3 CITIES
            <br />
            <strong>1 NETWORK</strong>
          </div>
        </div>
      </section>
      <div className="city-strip">
        <span>MUMBAI</span>
        <Plus />
        <span>DELHI</span>
        <Plus />
        <span>BENGALURU</span>
        <span className="strip-note">Different centres. Same ambition.</span>
      </div>
      <section className="how">
        <div className="section-label">
          LESS SCROLLING. MORE CONNECTING. <ArrowDown size={18} />
        </div>
        <div className="feature-grid">
          {[
            {
              icon: Users,
              n: "01",
              title: "Put a face to your idea.",
              text: "Your company, your story, your links. A profile that won’t disappear in the WhatsApp chat.",
            },
            {
              icon: Search,
              n: "02",
              title: "Find your kind of people.",
              text: "Search across the whole directory. Filter by city, sector, stage, and more.",
            },
            {
              icon: QrCode,
              n: "03",
              title: "Take it offline, too.",
              text: "Share your personal QR at the event. Save a contact and keep the conversation going.",
            },
          ].map((f) => (
            <article className="feature" key={f.n}>
              <div>
                <f.icon size={28} />
                <span>{f.n}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="community-note">
        <Check size={20} />
        <span>
          For participants, by a participant. Your contact details are shared
          only inside the signed-in network.
        </span>
      </div>
    </main>
  );
}
