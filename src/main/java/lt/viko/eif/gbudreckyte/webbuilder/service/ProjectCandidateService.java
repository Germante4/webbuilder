package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.ProjectCandidate;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;
import lt.viko.eif.gbudreckyte.webbuilder.model.GenerationStatus;
import lt.viko.eif.gbudreckyte.webbuilder.repository.ProjectCandidateRepository;
import lt.viko.eif.gbudreckyte.webbuilder.repository.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProjectCandidateService {
    private final ProjectCandidateRepository candidateRepository;
    private final ProjectRepository projectRepository;
    private final ProjectService projectService;

    public ProjectCandidateService(ProjectCandidateRepository candidateRepository,
                                   ProjectRepository projectRepository,
                                   ProjectService projectService) {
        this.candidateRepository = candidateRepository;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
    }

    @Transactional
    public ProjectCandidate saveCandidate(Long projectId, String stitchProjectId,
                                          String stitchScreenId, String html,
                                          String instruction, User owner) {
        Project project = projectService.getProjectByIdForUpdate(projectId, owner);
        ensureGenerationInactive(project);
        if (candidateRepository.existsByProjectId(projectId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Projektas jau turi nepatvirtintą AI versiją.");
        }
        if (stitchScreenId == null || stitchScreenId.isBlank()
                || html == null || html.isBlank()
                || instruction == null || instruction.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Trūksta AI versijos duomenų.");
        }
        ProjectCandidate candidate = ProjectCandidate.builder()
                .project(project)
                .stitchProjectId(stitchProjectId)
                .stitchScreenId(stitchScreenId)
                .generatedHtml(html)
                .instruction(instruction)
                .build();
        return candidateRepository.save(candidate);
    }

    @Transactional(readOnly = true)
    public ProjectCandidate getCandidate(Long projectId, User owner) {
        projectService.getProjectById(projectId, owner);
        return candidateRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "AI versija nerasta."));
    }

    @Transactional
    public Project chooseVersion(Long projectId, String selectedVersion, User owner) {
        Project project = projectService.getProjectByIdForUpdate(projectId, owner);
        ensureGenerationInactive(project);
        ProjectCandidate candidate = candidateRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Nėra versijų, iš kurių galima pasirinkti."));

        if ("NEW".equals(selectedVersion)) {
            project.setGeneratedHtml(candidate.getGeneratedHtml());
            project.setPersonalizedHtml(null);
            Long version = project.getPersonalizationVersion();
            project.setPersonalizationVersion(version == null ? 1L : version + 1L);
            // Stitch ID nekeičiame, nes B versija turi lokalų UUID.
            projectRepository.save(project);
        } else if (!"CURRENT".equals(selectedVersion)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Pasirinkimas turi būti CURRENT arba NEW.");
        }
        candidateRepository.delete(candidate);
        return project;
    }

    @Transactional(readOnly = true)
    public boolean hasCandidate(Long projectId, User owner) {
        projectService.getProjectById(projectId, owner);
        return candidateRepository.existsByProjectId(projectId);
    }

    private void ensureGenerationInactive(Project project) {
        if (project.getGenerationStatus() == GenerationStatus.PENDING
                || project.getGenerationStatus() == GenerationStatus.GENERATING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Palaukite, kol svetainės generavimas bus baigtas.");
        }
    }
}
