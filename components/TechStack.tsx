import { TECH_STACK } from "@/lib/tech-stack";

export default function TechStack() {
  return (
    <div className="techstack rv">
      {TECH_STACK.map((g) => (
        <div className="ts-group" key={g.category}>
          <span className="ts-cat">{g.category}</span>
          <div className="ts-chips">
            {g.items.map((item) => (
              <span className="ts-chip" key={item}>{item}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
