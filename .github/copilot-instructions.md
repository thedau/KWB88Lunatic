<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->
 [x] Verify that the copilot-instructions.md file in the .github directory is created.

	<!-- Ask for project type, language, and frameworks if not specified. Skip if already provided. -->
 [x] Clarify Project Requirements

	<!--
	Ensure that the previous step has been marked as completed.
	Call project setup tool with projectType parameter.
	Run scaffolding command to create project files and folders.
	Use '.' as the working directory.
	If no appropriate projectType is available, search documentation using available tools.
	Otherwise, create the project structure manually using available file creation tools.
	-->
 [x] Scaffold the Project

	<!--
	Verify that all previous steps have been completed successfully and you have marked the step as completed.
	Develop a plan to modify codebase according to user requirements.
	Apply modifications using appropriate tools and user-provided references.
	Skip this step for "Hello World" projects.
	-->
 [x] Customize the Project

	<!-- ONLY install extensions mentioned in the project setup information. Skip this step otherwise and mark as completed. -->
 [x] Install Required Extensions

	<!--
	Verify that all previous steps have been completed.
	Install any missing dependencies.
	Run diagnostics and resolve any issues.
	Check for markdown files in project folder for relevant instructions on how to do this.
	-->
 [x] Compile the Project

	<!--
	Verify that all previous steps have been completed.
	Check https://code.visualstudio.com/docs/debugtest/tasks to determine if the project needs a task. If so, use the create_and_run_task to create and launch a task based on package.json, README.md, and project structure.
	Skip this step otherwise.
	 -->
 [x] Create and Run Task

	<!--
	Verify that all previous steps have been completed.
	Prompt user for debug mode, launch only if confirmed.
	 -->
 [x] Launch the Project

	<!--
	Verify that all previous steps have been completed.
	Verify that README.md and the copilot-instructions.md file in the .github directory exists and contains current project information.
	Clean up the copilot-instructions.md file in the .github directory by removing all HTML comments.
	 -->
 [x] Ensure Documentation is Complete

<!--
## Execution Guidelines
PROGRESS TRACKING:

COMMUNICATION RULES:

DEVELOPMENT RULES:

FOLDER CREATION RULES:

EXTENSION INSTALLATION RULES:

PROJECT CONTENT RULES:

TASK COMPLETION RULES:
  - Project is successfully scaffolded and compiled without errors
  - copilot-instructions.md file in the .github directory exists in the project
  - README.md file exists and is up to date
  - User is provided with clear instructions to debug/launch the project

Before starting a new task in the above plan, update progress in the plan.

- Project: Epic Seven Draft Lab
- Stack: Vite, React, TypeScript, CSS
- Run locally with `npm run dev`.
- Validate production output with `npm run build`.
- Keep the draft interactions in `src/App.tsx` and visual styles in `src/App.css` / `src/index.css`.
EXTENSION INSTALLATION RULES:
