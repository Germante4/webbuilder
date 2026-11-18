package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.CreateProjectRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.UpdateProjectRequest;
import lt.viko.eif.gbudreckyte.webbuilder.dto.contact.ProjectContactRequest;

import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.ProjectStatus;
import lt.viko.eif.gbudreckyte.webbuilder.model.GenerationStatus;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;
import lt.viko.eif.gbudreckyte.webbuilder.model.WebsiteCategory;

import lt.viko.eif.gbudreckyte.webbuilder.repository.ProjectRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    // =====================================================
    // PROJEKTO SUKŪRIMAS
    // =====================================================

    public Project createProject(
            CreateProjectRequest request,
            User owner
    ) {
        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .status(ProjectStatus.DRAFT)
                .websiteCategory(request.getWebsiteCategory())
                .owner(owner)
                .build();

        return projectRepository.save(project);
    }

    // =====================================================
    // VARTOTOJO PROJEKTAI
    // =====================================================

    public List<Project> getUserProjects(User owner) {
        return projectRepository
                .findAllByOwnerOrderByCreatedAtDesc(owner);
    }

    public Project getProjectById(
            Long id,
            User owner
    ) {
        return projectRepository
                .findByIdAndOwner(id, owner)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Projektas nerastas."
                        )
                );
    }

    // =====================================================
    // PROJEKTO ATNAUJINIMAS
    // =====================================================

    public Project updateProject(
            Long id,
            UpdateProjectRequest request,
            User owner
    ) {
        Project project = getProjectById(id, owner);

        project.setName(request.name());
        project.setDescription(request.description());

        return projectRepository.save(project);
    }

    // =====================================================
    // PROJEKTO IŠTRYNIMAS
    // =====================================================

    public void deleteProject(
            Long id,
            User owner
    ) {
        Project project = getProjectById(id, owner);

        if (isGenerationActive(project)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Negalima ištrinti generuojamo projekto."
            );
        }

        projectRepository.delete(project);
    }

    // =====================================================
    // SUGENERUOTOS SVETAINĖS IŠSAUGOJIMAS
    // =====================================================

    public Project saveGeneratedProject(
            String name,
            String description,
            WebsiteCategory category,
            String stitchProjectId,
            String stitchScreenId,
            String generatedHtml,
            User owner,
            ProjectContactRequest contactInformation
    ) {
        if (stitchScreenId == null ||
                stitchScreenId.isBlank()) {

            throw new IllegalArgumentException(
                    "Trūksta Stitch ekrano ID."
            );
        }

        if (generatedHtml == null ||
                generatedHtml.isBlank()) {

            throw new IllegalArgumentException(
                    "Sugeneruotas HTML negali būti tuščias."
            );
        }

        Optional<Project> existingProject =
                projectRepository.findByStitchScreenId(
                        stitchScreenId
                );

        // Jeigu Stitch ekranas jau išsaugotas,
        // antro projekto nekuriame.

        if (existingProject.isPresent()) {

            Project existing = existingProject.get();

            if (!existing.getOwner().getId()
                    .equals(owner.getId())) {

                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Ši svetainė priklauso kitam vartotojui."
                );
            }

            if (contactInformation != null) {
                existing.setContactInformation(
                        contactInformation
                );

                return projectRepository.save(existing);
            }

            return existing;
        }

        Project project = Project.builder()
                .name(name)
                .description(description)
                .websiteCategory(category)
                .status(ProjectStatus.DRAFT)
                .generationStatus(GenerationStatus.COMPLETED)
                .stitchProjectId(stitchProjectId)
                .stitchScreenId(stitchScreenId)
                .generatedHtml(generatedHtml)
                .contactInformation(contactInformation)
                .owner(owner)
                .build();

        return projectRepository.save(project);
    }

    // =====================================================
    // PROJEKTO PAIEŠKA PAGAL STITCH SCREEN ID
    // =====================================================

    public Project getProjectByStitchScreenId(
            String screenId,
            User owner
    ) {
        Project project = projectRepository
                .findByStitchScreenId(screenId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Projektas nerastas."
                        )
                );

        if (!project.getOwner().getId()
                .equals(owner.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Projektas nerastas."
            );
        }

        return project;
    }

    // =====================================================
    // SUGENERUOTO DIZAINO ATNAUJINIMAS
    // =====================================================

    public Project updateGeneratedDesign(
            Project project,
            String stitchProjectId,
            String stitchScreenId,
            String html
    ) {
        return updateGeneratedDesign(
                project,
                stitchProjectId,
                stitchScreenId,
                html,
                null
        );
    }

    public Project updateGeneratedDesign(
            Project project,
            String stitchProjectId,
            String stitchScreenId,
            String html,
            ProjectContactRequest contactInformation
    ) {
        if (isGenerationActive(project)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Palaukite, kol bus baigtas generavimas."
            );
        }

        if (stitchScreenId == null ||
                stitchScreenId.isBlank() ||
                html == null ||
                html.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trūksta sugeneruoto dizaino duomenų."
            );
        }

        project.setStitchProjectId(stitchProjectId);
        project.setStitchScreenId(stitchScreenId);
        project.setGeneratedHtml(html);

        project.setGenerationStatus(GenerationStatus.COMPLETED);
        project.setGenerationError(null);

        // Jeigu naujų kontaktų negavome,
        // išsaugome ankstesnius kontaktus.

        if (contactInformation != null) {
            project.setContactInformation(
                    contactInformation
            );
        }

        return projectRepository.save(project);
    }

    // =====================================================
    // ASINCHRONINIS SVETAINĖS GENERAVIMAS
    // PROJEKTO PARUOŠIMAS
    // =====================================================

    @Transactional
    public Project prepareProjectForGeneration(
            String name,
            String description,
            WebsiteCategory category,
            Long existingProjectId,
            User owner,
            ProjectContactRequest contactInformation
    ) {
        Project project;

        if (existingProjectId != null) {

            project = getProjectById(
                    existingProjectId,
                    owner
            );

            if (isGenerationActive(project)) {

                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Šis projektas jau generuojamas."
                );
            }

        } else {

            project = Project.builder()
                    .name(name)
                    .description(description)
                    .websiteCategory(category)
                    .status(ProjectStatus.DRAFT)
                    .owner(owner)
                    .build();
        }

        if (contactInformation != null) {
            project.setContactInformation(
                    contactInformation
            );
        }

        project.setGenerationStatus(
                GenerationStatus.PENDING
        );

        project.setGenerationError(null);

        return projectRepository.save(project);
    }

    // =====================================================
    // GENERAVIMO PRADŽIA
    // =====================================================

    @Transactional
    public void markGenerationStarted(Long projectId) {

        Project project = findGenerationProject(projectId);

        if (project.getGenerationStatus() !=
                GenerationStatus.PENDING) {

            throw new IllegalStateException(
                    "Projektas neparuoštas generavimui."
            );
        }

        project.setGenerationStatus(
                GenerationStatus.GENERATING
        );

        project.setGenerationError(null);

        projectRepository.save(project);
    }

    // =====================================================
    // SĖKMINGO GENERAVIMO REZULTATO IŠSAUGOJIMAS
    // =====================================================

    @Transactional
    public Project completeGeneration(
            Long projectId,
            String stitchProjectId,
            String stitchScreenId,
            String html
    ) {
        if (stitchProjectId == null ||
                stitchProjectId.isBlank() ||
                stitchScreenId == null ||
                stitchScreenId.isBlank() ||
                html == null ||
                html.isBlank()) {

            throw new IllegalArgumentException(
                    "Trūksta sugeneruotos svetainės duomenų."
            );
        }

        Project project = findGenerationProject(projectId);

        if (project.getGenerationStatus() !=
                GenerationStatus.GENERATING) {

            throw new IllegalStateException(
                    "Projektas šiuo metu negeneruojamas."
            );
        }

        project.setStitchProjectId(stitchProjectId);
        project.setStitchScreenId(stitchScreenId);
        project.setGeneratedHtml(html);

        project.setGenerationStatus(
                GenerationStatus.COMPLETED
        );

        project.setGenerationError(null);

        return projectRepository.save(project);
    }

    // =====================================================
    // NESĖKMINGAS GENERAVIMAS
    // =====================================================

    @Transactional
    public void markGenerationFailed(
            Long projectId,
            String error
    ) {
        Project project = findGenerationProject(projectId);

        if (!isGenerationActive(project)) {
            return;
        }

        project.setGenerationStatus(
                GenerationStatus.FAILED
        );

        project.setGenerationError(
                error != null && !error.isBlank()
                        ? error
                        : "Nepavyko sugeneruoti svetainės."
        );

        // Ankstesnio HTML neištriname.
        // Jeigu projektas jau turėjo dizainą,
        // jis išliks net ir nepavykus naujam generavimui.

        projectRepository.save(project);
    }

    // =====================================================
    // PAGALBINIAI METODAI
    // =====================================================

    private Project findGenerationProject(Long projectId) {

        return projectRepository.findById(projectId)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Generuojamas projektas nerastas."
                        )
                );
    }

    private boolean isGenerationActive(Project project) {

        GenerationStatus status =
                project.getGenerationStatus();

        return status == GenerationStatus.PENDING ||
                status == GenerationStatus.GENERATING;
    }
}