import { Link } from "react-router-dom";
import "../styles/WebsiteGenerationScreen.css";

type Props = { status: "PENDING" | "GENERATING" };

export default function WebsiteGenerationScreen({ status }: Props) {
  const pending = status === "PENDING";
  return (
    <section className="wb-generation" aria-label="Svetainės generavimo būsena">
      <div className="wb-generation-topline">
        <span><span className="wb-generation-sparkle">✳</span> WEBBUILDER AI</span>
        <span className="wb-generation-live"><span className="wb-generation-live-dot" />{pending ? "LAUKIA EILĖJE" : "GENERUOJAMA"}</span>
      </div>
      <div className="wb-generation-visual" aria-hidden="true">
        <div className="wb-generation-orbit wb-generation-orbit-one" />
        <div className="wb-generation-orbit wb-generation-orbit-two" />
        <div className="wb-generation-browser">
          <div className="wb-generation-browserbar"><span className="wb-generation-dots"><i/><i/><i/></span><span className="wb-generation-address">jūsų-svetainė.lt</span><span className="wb-generation-browser-icon">✳</span></div>
          <div className="wb-generation-browserbody">
            <div className="wb-generation-mocknav"><span className="wb-generation-mocklogo"/><span className="wb-generation-mocklinks"><i/><i/><i/></span></div>
            <div className="wb-generation-mockhero"><div className="wb-generation-mockcopy"><span className="wb-generation-mockeyebrow"/><span className="wb-generation-mockheading"/><span className="wb-generation-mockheading short"/><span className="wb-generation-mocktext"/><span className="wb-generation-mocktext small"/><span className="wb-generation-mockbutton"/></div><div className="wb-generation-mockimage"><div className="wb-generation-mocksun"/><div className="wb-generation-mockhill"/></div></div>
            <div className="wb-generation-mockcards"><i/><i/><i/></div>
          </div>
          <div className="wb-generation-shimmer" />
        </div>
        <div className="wb-generation-float wb-generation-float-a">✦</div>
        <div className="wb-generation-float wb-generation-float-b">✳</div>
      </div>
      <div className="wb-generation-content">
        <p className="wb-generation-eyebrow">NUO IDĖJOS IKI SVETAINĖS</p>
        <h2>{pending ? "Jūsų idėja jau pakeliui." : "Kuriame kažką ypatingo."}</h2>
        <p className="wb-generation-description">{pending ? "Jūsų projektas laukia savo eilės. Netrukus pradėsime kurti individualų svetainės dizainą." : "Jūsų idėjos virsta individualiu svetainės dizainu. Dirbtinis intelektas formuoja svetainę pagal jūsų pasirinktą kryptį."}</p>
        <div className="wb-generation-progress" role="status" aria-live="polite">
          <div className="wb-generation-progress-label"><span>{pending ? "Laukiama generavimo" : "Dizaino generavimas"}</span><span className="wb-generation-progress-state"><span className="wb-generation-spinner"/>{pending ? "Eilėje" : "Vykdoma"}</span></div>
          <div className="wb-generation-track"><span className="wb-generation-track-motion"/></div>
          <p>Procesas gali užtrukti kelias minutes. Eigos procentai nerodomi, nes generavimo trukmė nėra iš anksto žinoma.</p>
        </div>
        <Link className="wb-generation-back" to="/dashboard">Grįžti į mano projektus <span aria-hidden="true">↗</span></Link>
        <p className="wb-generation-footnote">Galite uždaryti šį puslapį – generavimas tęsis serveryje, kol jis veikia.</p>
      </div>
    </section>
  );
}
