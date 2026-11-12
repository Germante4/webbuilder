package lt.viko.eif.gbudreckyte.webbuilder.service;

import lt.viko.eif.gbudreckyte.webbuilder.dto.CreateProjectRequest;
import lt.viko.eif.gbudreckyte.webbuilder.model.Project;
import lt.viko.eif.gbudreckyte.webbuilder.model.ProjectStatus;
import lt.viko.eif.gbudreckyte.webbuilder.model.User;
import lt.viko.eif.gbudreckyte.webbuilder.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

import lt.viko.eif.gbudreckyte.webbuilder.dto.UpdateProjectRequest;
import lt.viko.eif.gbudreckyte.webbuilder.model.WebsiteCategory;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public Project createProject(CreateProjectRequest request, User owner) {

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .status(ProjectStatus.DRAFT)
                .websiteCategory(request.getWebsiteCategory())
                .owner(owner)
                .build();

        return projectRepository.save(project);
    }
    public List<Project> getUserProjects(User owner) {
        return projectRepository.findAllByOwnerOrderByCreatedAtDesc(owner);
    }
    public Project getProjectById(Long id, User owner) {
        return projectRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new RuntimeException("Projektas nerastas"));
    }
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

    public void deleteProject(Long id, User owner) {
        Project project = getProjectById(id, owner);

        projectRepository.delete(project);
    }

    public Project saveGeneratedProject(
            String name,
            String description,
            WebsiteCategory category,
            String stitchProjectId,
            String stitchScreenId,
            String generatedHtml,
            User owner
    ) {
        if (stitchScreenId == null || stitchScreenId.isBlank()) {
            throw new IllegalArgumentException(
                    "Trūksta Stitch ekrano ID."
            );
        }

        if (generatedHtml == null || generatedHtml.isBlank()) {
            throw new IllegalArgumentException(
                    "Sugeneruotas HTML negali būti tuščias."
            );
        }

        Optional<Project> existingProject =
                projectRepository.findByStitchScreenId(stitchScreenId);

        if (existingProject.isPresent()) {
            Project existing = existingProject.get();

            if (!existing.getOwner().getId().equals(owner.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Ši svetainė priklauso kitam vartotojui."
                );
            }

            return existing;
        }

        Project project = Project.builder()
                .name(name)
                .description(description)
                .websiteCategory(category)
                .status(ProjectStatus.DRAFT)
                .stitchProjectId(stitchProjectId)
                .stitchScreenId(stitchScreenId)
                .generatedHtml(generatedHtml)
                .owner(owner)
                .build();

        return projectRepository.save(project);
    }

    public Project getProjectByStitchScreenId(
            String screenId,
            User owner
    ) {
        Project project = projectRepository
                .findByStitchScreenId(screenId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Projektas nerastas."
                ));

        if (!project.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Projektas nerastas."
            );
        }

        return project;
    }

    public Project updateGeneratedDesign(
            Project project,
            String stitchProjectId,
            String stitchScreenId,
            String html
    ) {
        if (stitchScreenId == null || stitchScreenId.isBlank()
                || html == null || html.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trūksta sugeneruoto dizaino duomenų."
            );
        }

        project.setStitchProjectId(stitchProjectId);
        project.setStitchScreenId(stitchScreenId);
        project.setGeneratedHtml(html);

        return projectRepository.save(project);
    }


}