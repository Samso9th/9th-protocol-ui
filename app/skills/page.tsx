"use client";
import { Shell } from "@/components/shell";
import { Library } from "@/components/workspace/library";
import { BUILTIN_SKILLS, SKILLS_GALLERY } from "@/lib/gallery";
export default function SkillsPage() {
  return (
    <Shell>
      {() => (
        <Library
          title="A little expertise, on demand."
          description="Find a playbook for your next task. Skills give your local agent focused instructions, right when you need them."
          icon="sparkles"
          entries={[
            ...BUILTIN_SKILLS.map((s) => ({
              name: `/${s.name}`,
              description: s.description,
              note: "Built-in skill",
              content: s.content,
              instructions: `Save as .9p/skills/${s.name}.md in your project or ~/.9p/skills/${s.name}.md globally, then invoke /${s.name} in a local session.`,
            })),
            ...SKILLS_GALLERY.map((s) => ({
              name: s.name,
              description: s.description,
              note: s.note,
              href: s.repo,
              instructions:
                "Adapt the instructions you need into a 9p skill file before invoking it.",
            })),
          ]}
          guide={{
            title: "Create a skill",
            text: "Save a Markdown playbook in .9p/skills/ for one project, or ~/.9p/skills/ for all your projects. Invoke /name to load it into your local agent’s context.",
            content:
              "---\nname: review\ndescription: Review the current changes\n---\n1. Inspect the diff and relevant surrounding code.\n2. Identify concrete bugs and explain their impact.\n3. Suggest a fix before making changes.",
          }}
        />
      )}
    </Shell>
  );
}
