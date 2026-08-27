"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./icons";

const slides = [
  ["/img/hero-bg.jpg", "太朗と花子が白いユリの上で結婚指輪を見せている", "/img/hero-1_sp.webp"],
  ["/img/hero-2.jpg", "太朗と花子が庭で手をつないでいる", "/img/hero-2_sp.webp"],
  ["/img/hero-3.webp", "太朗と花子がアーチの下で踊っている", "/img/hero-3_sp.webp"],
] as const;

const timeline = [
  ["午前9:30", "pin", "ご来場", "受付・ご着席"],
  ["午前9:50", "heart", "挙式", "神前式にて誓いの言葉"],
  ["午前10:25", "glass", "乾杯", "披露宴開宴の乾杯"],
  ["午前11:30", "utensils", "お食事", "心を込めたお料理のひととき"],
  ["午後12:30", "music", "余興", "音楽とお祝いで盛り上がる"],
  ["午後1:15", "sparkles", "お祝い", "笑顔あふれるひととき"],
  ["午後3:20", "wave", "お見送り", "感謝の気持ちを込めて"],
] as const satisfies readonly (readonly [string, IconName, string, string])[];

const mapSrc = "https://www.google.com/maps?q=35.6907214,139.6901356&output=embed";
const mapUrl = "https://maps.google.com/?q=Keio+Plaza+Hotel+Tokyo";
const calendarUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=%E5%A4%AA%E6%9C%97+%26+%E8%8A%B1%E5%AD%90+%E7%B5%90%E5%A9%9A%E5%BC%8F&dates=20261214T093000%2F20261214T153000&ctz=Asia%2FTokyo&details=%E7%B5%90%E5%A9%9A%E5%BC%8F%E3%81%AE%E3%81%94%E6%8B%9B%E5%BE%85&location=%E4%BA%AC%E7%8E%8B%E3%83%97%E3%83%A9%E3%82%B6%E3%83%9B%E3%83%86%E3%83%AB%2C+%E6%9D%B1%E4%BA%AC";

export default function Home() {
  const [opening, setOpening] = useState(false);
  const [finishingOpening, setFinishingOpening] = useState(false);
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
    const envelope = envelopeSound.current;
    if (envelope) {
      envelope.volume = 0.12;
      envelope.play().catch(() => undefined);
    }
    const music = backgroundMusic.current;
    if (music) {
      music.volume = 0;
      music.play().catch(() => undefined);
    }
    const video = openingVideo.current;
    if (video) {
      video.playbackRate = 1.5;
      video.play().catch(finishOpening);
    }
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

  const cueOpeningFade = () => {
    const video = openingVideo.current;
    if (!video || finishingOpening || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (video.duration - video.currentTime <= 2.8) {
      video.playbackRate = 1;
      setFinishingOpening(true);
    }
  };

  const skipOpening = () => {
    setFinishingOpening(false);
    finishOpening();
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
        <div className={`opening-gate${finishingOpening ? " is-finishing" : ""}`}>
          <video ref={openingVideo} className="opening-video" muted playsInline preload="auto" onTimeUpdate={cueOpeningFade} onEnded={finishOpening}>
            <source media="(max-width: 767px)" src="/img/portrait-champagne.mp4" type="video/mp4" />
            <source src="/img/landscape-champagne.mp4" type="video/mp4" />
          </video>
          {!opening ? (
            <button className="opening-trigger" type="button" onClick={beginOpening}>
              <span>太朗 & 花子</span><small>タップして開く</small>
            </button>
          ) : (
            <button className="opening-skip" type="button" onClick={skipOpening}>スキップ</button>
          )}
        </div>
      )}

      {opened && finishingOpening && (
        <div className="opening-wash-out" aria-hidden="true" onAnimationEnd={() => setFinishingOpening(false)} />
      )}

      {opened && (
        <button className={`music-toggle${musicPlaying ? " is-playing" : ""}`} type="button" onClick={toggleMusic} aria-label={musicPlaying ? "音楽を一時停止" : "音楽を再生"}>
          <Icon name={musicPlaying ? "pause" : "music"} />
        </button>
      )}

      <section className="hero" id="home">
        <div className="hero-slider">
          {slides.map(([src, alt, mobileSrc], index) => (
            <div className="hero-slide-layer" style={{ opacity: activeSlide === index ? 1 : 0 }} key={src}>
              <picture className="hero-picture">
                {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
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
              </picture>
            </div>
          ))}
        </div>
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="section-label on-dark">日程のお知らせ</p>
          <h1>太朗&<br />花子</h1>
          <div className="hero-date"><span>12月</span><strong>14</strong><span>2026年</span></div>
          <a className="scroll-cue" href="#couple"><span>下へスクロール</span><Icon name="chevron-down" /></a>
        </div>
        <div className="slider-dots" aria-label="ウェディングフォト">
          {slides.map(([src], index) => (
            <button className={activeSlide === index ? "active" : ""} key={src} type="button" aria-label={`Go to slide ${index + 1}`} aria-current={activeSlide === index ? "true" : undefined} onClick={() => setActiveSlide(index)} />
          ))}
        </div>
      </section>

      <section className="couple-section page-section" id="couple">
        <div className="couple-grid">
          <article className="person-card">
            <Image src="/img/groom.jpg" alt="太朗 — 新郎" fill sizes="(max-width: 700px) 288px, 288px" />
            <div className="person-shade" />
            <div className="person-copy"><h2>太朗</h2><span>新郎</span><p>この特別な日を、大切な皆様とともに迎えられることを心より嬉しく思います。素敵な一日にしましょう。</p></div>
          </article>
          <article className="person-card">
            <Image src="/img/bride.jpg" alt="花子 — 新婦" fill sizes="(max-width: 700px) 288px, 288px" />
            <div className="person-shade" />
            <div className="person-copy"><h2>花子</h2><span>新婦</span><p>温かいご祝福の中で、新しい門出を迎えられることを幸せに思います。どうぞよろしくお願いいたします。</p></div>
          </article>
        </div>
        <div className="marriage-note">
          <div className="heart"><Icon name="heart" /></div>
          <p className="section-label">私たちは</p>
          <h2 className="section-title">結婚します</h2>
          <p>私たちが出会ったあの日から、毎日が愛おしい思い出で満ちています。笑顔と感謝の気持ちを胸に、二人で歩んでまいります。この大切な節目に、ぜひお集まりいただければ幸いです。</p>
          <em>— 太朗 & 花子 —</em>
        </div>
      </section>

      <section className="location-section page-section" id="location">
        <div className="section-heading"><p className="section-label">会場のご案内</p><h2 className="section-title">アクセス</h2></div>
        <div className="location-card">
          <div className="location-pin"><Icon name="pin" /></div>
          <h3>京王プラザホテル</h3>
          <p>東京都新宿区西新宿</p>
          <span className="time-chip"><Icon name="clock" />午前9時30分〜午後3時30分</span>
          <div className="map-frame"><iframe src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="結婚式会場の地図" /></div>
          <div className="location-actions">
            <a className="primary-button" href={mapUrl} target="_blank" rel="noreferrer"><Icon name="pin" />地図で開く<Icon name="external-link" /></a>
            <a className="secondary-button" href={calendarUrl} target="_blank" rel="noreferrer"><Icon name="calendar" />カレンダーに追加<Icon name="arrow-down" /></a>
          </div>
        </div>
      </section>

      <section className="timeline-section page-section">
        <div className="section-heading"><p className="section-label">お式の流れ</p><h2 className="section-title">タイムライン</h2></div>
        <div className="timeline-scroll">
          <ol>
            {timeline.map(([time, icon, title, description]) => (
              <li key={time}><time>{time}</time><span className="timeline-icon"><Icon name={icon} /></span><h3>{title}</h3><p>{description}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <footer><h3>太朗 & 花子</h3><p>2026年12月14日</p><p>太朗: 0715328308 &nbsp;|&nbsp; 花子: 0715129071</p><small>© 2026 ravinduranathilaka | 無断転載を禁じます</small></footer>
    </main>
  );
}
