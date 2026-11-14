
package lt.viko.eif.gbudreckyte.webbuilder.dto.contact;

import java.util.List;

public record ProjectContactRequest(
        String email,
        String phone,
        String address,
        String instagram,
        String facebook,
        List<AdditionalContact> additionalContacts
) {
    public record AdditionalContact(
            String label,
            String value
    ) {}
}
