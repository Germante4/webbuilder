
package lt.viko.eif.gbudreckyte.webbuilder.model;

public enum WebsiteCategory {

    GENERAL(
            "Bendrinė",
            "Vidinė sistemos kategorija.",
            false
    ),

    SERVICES(
            "Verslas ir paslaugos",
            "Įmonėms, specialistams, studijoms ir paslaugų teikėjams.",
            true
    ),

    PERSONAL(
            "Asmeninė svetainė / portfolio",
            "Kūrėjams, fotografams, asmeniniams prekės ženklams ir savo darbų pristatymui.",
            true
    ),

    OTHER(
            "Kita",
            "Renginiams, edukaciniams projektams ir kitoms veikloms.",
            true
    ),

    // Senos kategorijos paliekamos suderinamumui
    ECOMMERCE(
            "El. parduotuvė",
            "Produktams pristatyti ir parduoti internetu.",
            false
    ),

    PORTFOLIO(
            "Portfolio",
            "Darbams, projektams ir kūrybai pristatyti.",
            false
    ),

    SCHOOL(
            "Mokymų / edukacinė",
            "Kursams, mokymams ar edukacinei veiklai.",
            false
    ),

    EVENT(
            "Renginio svetainė",
            "Renginiui, konferencijai ar šventei.",
            false
    );

    private final String displayName;
    private final String description;
    private final boolean selectable;

    WebsiteCategory(
            String displayName,
            String description,
            boolean selectable
    ) {
        this.displayName = displayName;
        this.description = description;
        this.selectable = selectable;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public boolean isSelectable() {
        return selectable;
    }
}
