
package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.contact.ProjectContactRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchGenerationRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchGenerationResponse;
import lt.viko.eif.gbudreckyte.webbuilder.dto.stitch.StitchSavedHtmlResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class StitchGenerationService {

    private final RestClient restClient;
    private final String internalToken;

    public StitchGenerationService(
            @Value("${stitch.service.url:http://127.0.0.1:3001}")
            String serviceUrl,

            @Value("${stitch.internal.token}")
            String internalToken
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(serviceUrl)
                .build();

        this.internalToken = internalToken;
    }

    // =====================================================
    // SVETAINĖS GENERAVIMAS
    // =====================================================

    public StitchGenerationResponse generate(
            StitchGenerationRequest request
    ) {
        if (request == null ||
                request.prompt() == null ||
                request.prompt().isBlank()) {

            throw new IllegalArgumentException(
                    "Stitch promptas negali būti tuščias."
            );
        }

        // Prie pagrindinio prompto pridedame kontaktus.
        String finalPrompt = request.prompt()
                + buildContactContext(request.contactInformation());

        System.out.println(
                "\n========== SPRING → STITCH =========="
        );
        System.out.println(finalPrompt);
        System.out.println(
                "=====================================\n"
        );

        StitchGenerationResponse response = restClient.post()
                .uri("/generate")
                .header("x-internal-token", internalToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("prompt", finalPrompt))
                .retrieve()
                .body(StitchGenerationResponse.class);

        if (response == null) {
            throw new IllegalStateException(
                    "Stitch negrąžino generavimo rezultato."
            );
        }

        return response;
    }

    // =====================================================
    // KONTAKTINĖS INFORMACIJOS PARUOŠIMAS
    // =====================================================

    private String buildContactContext(
            ProjectContactRequest contacts
    ) {
        StringBuilder context = new StringBuilder();

        context.append("""

                
                =========================
                CONTACT INFORMATION RULES
                =========================

                Use only contact information explicitly
                provided by the user.

                Never invent email addresses, phone numbers,
                physical addresses, social media profiles,
                opening hours or other contact details.

                If a contact field is missing or empty,
                do not display placeholder or fictional values.

                If no contact information is provided,
                do not generate fictional contact details.

                Preserve the exact values of provided contacts.
                Do not modify phone numbers, email addresses
                or social media links.

                Integrate the provided contact information
                naturally into the website design.

                Do not create unnecessary contact elements
                for information that was not provided.

                =========================
                PROVIDED CONTACT INFORMATION
                =========================

                """);

        // Kontaktai neprivalomi.
        if (contacts == null) {
            context.append(
                    "No contact information was provided.\n"
            );
            return context.toString();
        }

        boolean hasContacts = false;

        hasContacts |= appendContact(
                context,
                "Email",
                contacts.email()
        );

        hasContacts |= appendContact(
                context,
                "Phone",
                contacts.phone()
        );

        hasContacts |= appendContact(
                context,
                "Address",
                contacts.address()
        );

        hasContacts |= appendContact(
                context,
                "Instagram",
                contacts.instagram()
        );

        hasContacts |= appendContact(
                context,
                "Facebook",
                contacts.facebook()
        );

        // Vartotojo pridėti papildomi laukai.
        if (contacts.additionalContacts() != null) {

            for (ProjectContactRequest.AdditionalContact contact
                    : contacts.additionalContacts()) {

                if (contact == null) {
                    continue;
                }

                hasContacts |= appendContact(
                        context,
                        contact.label(),
                        contact.value()
                );
            }
        }

        if (!hasContacts) {
            context.append(
                    "No contact information was provided.\n"
            );
        }

        return context.toString();
    }

    // Pridedame tik užpildytus kontaktus.
    private boolean appendContact(
            StringBuilder context,
            String label,
            String value
    ) {
        if (label == null ||
                label.isBlank() ||
                value == null ||
                value.isBlank()) {

            return false;
        }

        context.append(label.trim())
                .append(": ")
                .append(value.trim())
                .append("\n");

        return true;
    }

    // =====================================================
    // AI DIZAINO TOBULINIMAS
    // =====================================================

    public StitchGenerationResponse refine(
            String projectId,
            String screenId,
            String instruction,
            String currentHtml
    ) {
        if (projectId == null || projectId.isBlank()) {
            throw new IllegalArgumentException(
                    "Nenurodytas Stitch projekto ID."
            );
        }

        if (screenId == null || screenId.isBlank()) {
            throw new IllegalArgumentException(
                    "Nenurodytas Stitch ekrano ID."
            );
        }

        if (instruction == null ||
                instruction.isBlank() ||
                instruction.length() > 5000) {

            throw new IllegalArgumentException(
                    "AI redagavimo instrukcija turi būti nuo 1 iki 5000 simbolių."
            );
        }

        if (currentHtml == null || currentHtml.isBlank()) {
            throw new IllegalArgumentException(
                    "Projektas neturi išsaugoto HTML redagavimui."
            );
        }

        StitchGenerationResponse response = restClient.post()
                .uri("/refine")
                .header("x-internal-token", internalToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "projectId", projectId,
                        "screenId", screenId,
                        "instruction", instruction,
                        "currentHtml", currentHtml
                ))
                .retrieve()
                .body(StitchGenerationResponse.class);

        if (response == null ||
                response.screenId() == null ||
                response.screenId().isBlank()) {

            throw new IllegalStateException(
                    "Stitch negrąžino AI dizaino kandidato ID."
            );
        }

        if (screenId.equals(response.screenId())) {
            throw new IllegalStateException(
                    "AI redagavimas nesukūrė atskiros kandidato versijos."
            );
        }

        return response;
    }

    // =====================================================
    // SUGENERUOTO HTML GAVIMAS
    // =====================================================

    public String getSavedHtml(String screenId) {

        if (screenId == null || screenId.isBlank()) {
            throw new IllegalArgumentException(
                    "Nenurodytas Stitch ekrano ID."
            );
        }

        StitchSavedHtmlResponse response = restClient.post()
                .uri("/saved-html")
                .header("x-internal-token", internalToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("screenId", screenId))
                .retrieve()
                .body(StitchSavedHtmlResponse.class);

        if (response == null ||
                response.html() == null ||
                response.html().isBlank()) {

            throw new IllegalStateException(
                    "Nepavyko gauti išsaugoto Stitch HTML."
            );
        }

        return response.html();
    }
}
