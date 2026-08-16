"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { RsvpForm } from "./rsvp-form";

const slides = [
  ["/img/hero-bg.jpg", "Hiruni and Ravindu walking on the beach"],
  ["/img/hero-2.jpg", "Hiruni and Ravindu beneath glowing lanterns"],
  ["/img/hero-3.jpg", "Hiruni and Ravindu by the railway at sunset"],
] as const;

const timeline = [
  ["9:30 AM", "⌖", "We Welcome You", "Welcome & seating"],
  ["9:50 AM", "♡", "We Marry", "Sacred vows on Poruwa"],
  ["10:25 AM", "♢", "We Raise a Toast", "Drinks & celebrations begin"],
  ["11:30 PM", "♨", "We Dine", "Delightful wedding feast"],
  ["12:30 PM", "♫", "We Dance", "Celebrate with music & joy"],
  ["01:15 PM", "✦", "We Celebrate", "The ceremonial gathering"],
  ["03:20 PM", "⌁", "We Say Goodbye", "A beautiful send-off"],
] as const;

const mapSrc = "https://www.google.com/maps?q=7.3027672,80.6367887&output=embed";
const mapUrl = "https://maps.app.goo.gl/ZJ6S4TzJ5DrnDfjH8";
const calendarUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Hiruni+%26+Ravindu+Wedding&dates=20261214T093000%2F20261214T153000&ctz=Asia%2FColombo&details=Wedding+celebration&location=The+Grand+Kandyan+Hotel%2C+Kandy%2C+Sri+Lanka";

export default function Home() {
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const openingVideo = useRef<HTMLVideoElement>(null);
  const envelopeSound = useRef<HTMLAudioElement>(null);
  const backgroundMusic = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden";
    window.scrollTo(0, 0);
    return () => { document.body.style.overflow = ""; };
  }, [opened]);

  useEffect(() => {
    if (!opened) return;
    const timer = window.setInterval(
      () => setActiveSlide((slide) => (slide + 1) % slides.length),
      4000,
    );
    return () => window.clearInterval(timer);
  }, [opened]);

  const beginOpening = () => {
    setOpening(true);
    envelopeSound.current?.play().catch(() => undefined);
    const music = backgroundMusic.current;
    if (music) {
      music.volume = 0;
      music.play().catch(() => undefined);
    }
    openingVideo.current?.play().catch(finishOpening);
  };

  const finishOpening = () => {
    openingVideo.current?.pause();
    if (envelopeSound.current) {
      envelopeSound.current.pause();
      envelopeSound.current.currentTime = 0;
    }
    const music = backgroundMusic.current;
    if (music) {
      music.currentTime = 0;
      music.volume = 0.3;
      music.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
    }
    setOpened(true);
  };

  const toggleMusic = () => {
    const music = backgroundMusic.current;
    if (!music) return;
    if (music.paused) music.play().then(() => setMusicPlaying(true)).catch(() => undefined);
    else {
      music.pause();
      setMusicPlaying(false);
    }
  };

  return (
    <main>
      <audio ref={envelopeSound} src="/img/envelope.mp3" preload="auto" />
      <audio ref={backgroundMusic} src="/img/background.mp3" preload="auto" loop />

      {!opened && (
        <div className="opening-gate">
          <video ref={openingVideo} className="opening-video" muted playsInline preload="auto" onEnded={finishOpening}>
            <source media="(max-width: 767px)" src="/img/portrait-champagne.mp4" type="video/mp4" />
            <source src="/img/landscape-champagne.mp4" type="video/mp4" />
          </video>
          {!opening ? (
            <button className="opening-trigger" type="button" onClick={beginOpening}>
              <span>Hiruni & Ravindu</span><small>Tap to open</small>
            </button>
          ) : (
            <button className="opening-skip" type="button" onClick={finishOpening}>Skip</button>
          )}
        </div>
      )}

      {opened && (
        <button className={`music-toggle${musicPlaying ? " is-playing" : ""}`} type="button" onClick={toggleMusic} aria-label={musicPlaying ? "Pause music" : "Play music"}>
          <span aria-hidden="true">♫</span>
        </button>
      )}

      <section className="hero" id="home">
        <div className="hero-slider">
          {slides.map(([src, alt], index) => (
            <div className="hero-slide-layer" style={{ opacity: activeSlide === index ? 1 : 0 }} key={src}>
              <Image
                className="hero-slide"
                src={src}
                alt={alt}
                width={1920}
                height={1080}
                loading="eager"
                sizes="100vw"
                style={{ animation: activeSlide === index ? "hero-zoom 4s ease-out forwards" : "none", transform: activeSlide === index ? undefined : "scale(1)" }}
              />
            </div>
          ))}
        </div>
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="section-label on-dark">Save the date</p>
          <h1>Hiruni &<br />Ravindu</h1>
          <div className="hero-date"><span>December</span><strong>14</strong><span>2026</span></div>
          <a className="scroll-cue" href="#couple"><span>Scroll Down</span><i>⌄</i></a>
        </div>
        <div className="slider-dots" aria-label="Wedding photos">
          {slides.map(([, alt], index) => (
            <button className={activeSlide === index ? "active" : ""} key={alt} type="button" aria-label={`Go to slide ${index + 1}`} aria-current={activeSlide === index ? "true" : undefined} onClick={() => setActiveSlide(index)} />
          ))}
        </div>
      </section>

      <section className="couple-section page-section" id="couple">
        <div className="couple-grid">
          <article className="person-card">
            <Image src="/img/bride.jpg" alt="Hiruni — the bride" fill sizes="(max-width: 700px) 288px, 288px" />
            <div className="person-shade" />
            <div className="person-copy"><h2>Hiruni</h2><span>The Bride</span><p>With a heart full of love and gratitude, I can&apos;t wait to begin this beautiful journey with the one who makes every moment brighter.</p></div>
          </article>
          <article className="person-card">
            <Image src="/img/groom.jpg" alt="Ravindu — the groom" fill sizes="(max-width: 700px) 288px, 288px" />
            <div className="person-shade" />
            <div className="person-copy"><h2>Ravindu</h2><span>The Groom</span><p>Every love story is special, but ours is my favorite. I&apos;m blessed to share this journey with the most amazing person.</p></div>
          </article>
        </div>
        <div className="marriage-note">
          <div className="heart" aria-hidden="true">♡</div>
          <p className="section-label">We are</p>
          <h2 className="section-title">Getting Married</h2>
          <p>From the moment our paths crossed, we knew that our love story was just beginning. Every day since has been a chapter filled with laughter, growth, and unforgettable memories. As we take the next step in our journey together, we invite you to share in the joy of this new chapter.</p>
          <em>— Ravindu & Hiruni —</em>
        </div>
      </section>

      <section className="location-section page-section" id="location">
        <div className="section-heading"><p className="section-label">Join us at</p><h2 className="section-title">Location</h2></div>
        <div className="location-card">
          <div className="location-pin" aria-hidden="true">⌖</div>
          <h3>The Grand Kandyan Hotel</h3>
          <p>Kandy</p>
          <span className="time-chip">▣ &nbsp; 09:30 AM to 3:30 PM</span>
          <div className="map-frame"><iframe src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Wedding venue location" /></div>
          <div className="location-actions">
            <a className="primary-button" href={mapUrl} target="_blank" rel="noreferrer">⌖ &nbsp; Open in maps ↗</a>
            <a className="secondary-button" href={calendarUrl} target="_blank" rel="noreferrer">▣ &nbsp; Add to calendar ↓</a>
          </div>
        </div>
      </section>

      <section className="timeline-section page-section">
        <div className="section-heading"><p className="section-label">Our celebration</p><h2 className="section-title">Timeline</h2></div>
        <div className="timeline-scroll">
          <ol>
            {timeline.map(([time, icon, title, description]) => (
              <li key={time}><time>{time}</time><span className="timeline-icon" aria-hidden="true">{icon}</span><h3>{title}</h3><p>{description}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rsvp-section page-section" id="rsvp">
        <div className="rsvp-wrap">
          <p className="section-label">Be Our Guest</p>
          <h2 className="section-title">RSVP</h2>
          <p className="rsvp-deadline">Kindly respond by October 20, 2026</p>
          <RsvpForm />
          <p className="rsvp-contact-note">For any changes, please contact the couple directly using the phone numbers below.</p>
        </div>
      </section>

      <footer><h3>Hiruni & Ravindu</h3><p>December 14 2026</p><p>Hiruni: 0715129071 &nbsp;|&nbsp; Ravindu: 0715328308</p><small>© 2026 ravinduranathilaka | All rights reserved</small></footer>
    </main>
  );
}
