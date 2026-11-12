import { Link } from "react-router-dom";
import "../styles/HomePage.css";

function HomePage() {
  return (
    <div className="home-page">

      {/* NAVIGATION */}
      <header className="home-header">
        <Link to="/" className="home-logo">
          WEBBUILDER<span>.</span>
        </Link>

        <div className="home-header-label">
          AI WEBSITE BUILDER
        </div>

        <nav className="home-nav">
          <Link to="/login" className="home-login">
            Prisijungti
          </Link>

          <Link to="/register" className="home-nav-cta">
            Pradėti kurti
            <span>↗</span>
          </Link>
        </nav>
      </header>


      <main>

        {/* HERO */}
        <section className="home-hero">

          <div className="hero-left">

            <div className="hero-eyebrow">
              <span className="hero-dot" />
              AI SVETAINIŲ KŪRIMO ĮRANKIS
            </div>

            <h1>
              Sukurk svetainę
              <br />
              su AI, kuri
              <br />
              <em>atrodo kaip tavo.</em>
            </h1>

            <div className="hero-info">

              <p>
                Neužtenka parašyti vieno sakinio ir tikėtis gero dizaino.
                WebBuilder padeda AI suprasti tavo veiklą, poreikius ir
                vizualinį skonį dar prieš generuojant svetainę.
              </p>

              <Link to="/register" className="hero-button">
                <span>Kurti svetainę</span>
                <span className="hero-button-arrow">→</span>
              </Link>

            </div>

          </div>


          {/* VISUAL PREVIEW */}
          <div className="hero-right">

            <div className="hero-visual-top">
              <span>DESIGN DIRECTION</span>
              <span>01 / 03</span>
            </div>

            <div className="preview-card preview-main">

              <div className="preview-nav">
                <span>MAISON</span>
                <span>MENU</span>
              </div>

              <div className="preview-content">

                <span className="preview-small">
                  CREATIVE STUDIO
                </span>

                <h3>
                  Designed
                  <br />
                  with <em>intention.</em>
                </h3>

                <div className="preview-photo">
                  <div className="preview-shape" />
                  <span>01</span>
                </div>

              </div>

            </div>


            <div className="preview-card preview-back">

              <span className="preview-back-label">
                DIRECTION 02
              </span>

              <div className="preview-back-title">
                <span>BOLD</span>
                <em>but</em>
                <span>PERSONAL</span>
              </div>

            </div>


            <div className="hero-floating-note">
              <span>✦</span>
              Built around your choices.
            </div>

          </div>

        </section>


        {/* SIMPLE EXPLANATION */}
        <section className="home-explanation">

          <div className="explanation-label">
            <span>01</span>
            <p>PROBLEMA</p>
          </div>

          <div className="explanation-content">

            <p className="explanation-small">
              AI gali sukurti svetainę per kelias minutes.
              Bet jei AI nežino, ko iš tikrųjų nori,
              rezultatas dažnai lieka bendrinis.
            </p>

            <h2>
              Geras rezultatas prasideda ne nuo
              <em> geresnio prompto.</em>
              <br />
              Jis prasideda nuo geresnio
              <strong> supratimo.</strong>
            </h2>

          </div>

        </section>


        {/* DIFFERENCE */}
        <section className="difference-section">

          <div className="difference-heading">

            <div>
              <p className="section-eyebrow">
                KUO WEBBUILDER KITOKS?
              </p>

              <h2>
                Ne vienas promptas.
                <br />
                <em>Visa tavo vizija.</em>
              </h2>
            </div>

            <p className="difference-description">
              WebBuilder prieš generuodamas svetainę palaipsniui
              renka informaciją apie tavo projektą ir dizaino
              pasirinkimus.
            </p>

          </div>


          <div className="comparison">

            <div className="comparison-side comparison-old">

              <div className="comparison-top">
                <span>ĮPRASTAS AI GENERATORIUS</span>
                <span>01</span>
              </div>

              <div className="comparison-prompt">
                „Sukurk modernią svetainę mano grožio salonui.“
              </div>

              <div className="comparison-flow">
                <span>1 promptas</span>
                <span>→</span>
                <span>AI</span>
                <span>→</span>
                <span>Rezultatas</span>
              </div>

              <p>
                AI turi pats nuspręsti, ką tau reiškia „moderni“,
                kokios kompozicijos nori ir ką svetainėje akcentuoti.
              </p>

            </div>


            <div className="comparison-side comparison-webbuilder">

              <div className="comparison-top">
                <span>WEBBUILDER</span>
                <span>02</span>
              </div>

              <div className="comparison-signals">

                <span>Veikla</span>
                <span>Tikslas</span>
                <span>Auditorija</span>
                <span>Turinys</span>
                <span>Vizualiniai pasirinkimai</span>
                <span>Patinkančios kryptys</span>

              </div>

              <div className="comparison-flow comparison-flow-light">
                <span>Tavo pasirinkimai</span>
                <span>→</span>
                <span>Design DNA</span>
                <span>→</span>
                <span>AI</span>
              </div>

              <p>
                Prieš generavimą AI gauna daug išsamesnį tavo
                svetainės poreikių ir vizualinės krypties kontekstą.
              </p>

            </div>

          </div>

        </section>


        {/* PROCESS */}
        <section className="process-section">

          <div className="process-heading">

            <div>
              <p className="section-eyebrow">
                KAIP TAI VEIKIA
              </p>

              <h2>
                Tavo vizija
                <br />
                išryškėja
                <em> palaipsniui.</em>
              </h2>
            </div>

            <p>
              Tau nereikia iš anksto žinoti web dizaino terminų
              ar mokėti parašyti tobulo AI prompto.
            </p>

          </div>


          <div className="process-list">

            <div className="process-item">

              <span className="process-number">01</span>

              <div className="process-main">
                <h3>
                  Papasakok apie
                  <em> savo projektą</em>
                </h3>

                <p>
                  Atsakyk į klausimus apie veiklą, auditoriją,
                  svetainės tikslą, turinį ir svarbiausius poreikius.
                </p>
              </div>

              <span className="process-icon">↘</span>

            </div>


            <div className="process-item">

              <span className="process-number">02</span>

              <div className="process-main">
                <h3>
                  Rinkis tai,
                  <em> kas tau patinka</em>
                </h3>

                <p>
                  Keliose proceso vietose matysi skirtingas
                  vizualines kryptis ir galėsi pasirinkti
                  artimiausias tavo skoniui.
                </p>
              </div>

              <span className="process-icon">↘</span>

            </div>


            <div className="process-item">

              <span className="process-number">03</span>

              <div className="process-main">
                <h3>
                  Sistema
                  <em> tikslina kryptį</em>
                </h3>

                <p>
                  Kiti klausimai ir vizualiniai variantai gali
                  būti pritaikomi pagal ankstesnius tavo
                  pasirinkimus.
                </p>
              </div>

              <span className="process-icon">↘</span>

            </div>


            <div className="process-item">

              <span className="process-number">04</span>

              <div className="process-main">
                <h3>
                  AI jau žino,
                  <em> ką kurti</em>
                </h3>

                <p>
                  Surinkti atsakymai ir dizaino signalai tampa
                  struktūrizuota svetainės kryptimi, pagal kurią
                  generuojamas rezultatas.
                </p>
              </div>

              <span className="process-icon">→</span>

            </div>

          </div>

        </section>


        {/* DESIGN DNA */}
        <section className="dna-section">

          <div className="dna-left">

            <p className="section-eyebrow">
              DESIGN DNA
            </p>

            <h2>
              Tu renkiesi
              <br />
              vizualiai.
              <br />
              <em>Mes suprantame kodėl.</em>
            </h2>

            <p className="dna-description">
              Pasirinkus tau patinkantį variantą, sistema gali
              išsaugoti ne tik patį pasirinkimą, bet ir jo
              dizaino savybes.
            </p>

          </div>


          <div className="dna-card">

            <div className="dna-card-header">
              <span>YOUR DESIGN DNA</span>
              <span>● LIVE</span>
            </div>

            <div className="dna-row">
              <span>STYLE</span>
              <strong>Editorial / refined</strong>
            </div>

            <div className="dna-row">
              <span>COMPOSITION</span>
              <strong>Asymmetric</strong>
            </div>

            <div className="dna-row">
              <span>TYPOGRAPHY</span>
              <strong>Serif-led</strong>
            </div>

            <div className="dna-row">
              <span>IMAGERY</span>
              <strong>Image dominant</strong>
            </div>

            <div className="dna-row">
              <span>SPACING</span>
              <strong>Spacious</strong>
            </div>

            <div className="dna-row">
              <span>AVOID</span>
              <strong>Generic card layouts</strong>
            </div>

            <div className="dna-progress">
              <div className="dna-progress-fill" />
            </div>

            <div className="dna-footer">
              <span>Direction confidence</span>
              <span>82%</span>
            </div>

          </div>

        </section>


        {/* FINAL CTA */}
        <section className="final-section">

          <div className="final-label">
            READY WHEN YOU ARE
          </div>

          <h2>
            Nereikia žinoti,
            <br />
            kaip aprašyti dizainą.
            <br />
            <em>Užtenka žinoti, kas patinka.</em>
          </h2>

          <p>
            Pradėk nuo kelių klausimų. Toliau tavo svetainės
            kryptį išgryninsime kartu.
          </p>

          <Link to="/register" className="final-button">
            Pradėti kurti
            <span>↗</span>
          </Link>

        </section>

      </main>


      <footer className="home-footer">

        <Link to="/" className="home-logo">
          WEBBUILDER<span>.</span>
        </Link>

        <span>AI WEBSITE BUILDER</span>

        <span>2026</span>

      </footer>

    </div>
  );
}

export default HomePage;