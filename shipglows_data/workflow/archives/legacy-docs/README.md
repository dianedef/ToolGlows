# ToolGlows Documentation

Welcome to the ToolGlows documentation! This documentation follows the **BMAD (Breakthrough Method for Agile AI-Driven Development)** methodology for organization and structure.

## 📚 Documentation Structure

### Core Documentation

#### 1. [Project Brief](./project-brief.md)
High-level overview of the project, business context, stakeholders, and objectives.
- **Target Audience**: All stakeholders
- **Purpose**: Understand the project at a glance
- **Key Content**: Vision, goals, constraints, timeline

#### 2. [Product Requirements Document (PRD)](./prd.md)
Comprehensive product requirements including functional and non-functional requirements.
- **Target Audience**: Product managers, developers, QA
- **Purpose**: Define what needs to be built
- **Key Content**: User stories, requirements, success criteria

#### 3. [Architecture Document](./architecture.md)
Technical architecture, system design, and technology decisions.
- **Target Audience**: Developers, architects, technical leads
- **Purpose**: Understand system design and technical decisions
- **Key Content**: Architecture diagrams, technology stack, design patterns

#### 4. [Developer Guide](./developer-guide.md)
Practical guide for developers working with the codebase.
- **Target Audience**: Developers
- **Purpose**: Get started and work effectively with the code
- **Key Content**: Setup, workflow, best practices, troubleshooting

### BMAD-Organized Documentation

Following the BMAD methodology, our documentation is organized into these key areas:

```
docs/
├── project-brief.md        # Project overview and context
├── prd.md                  # Product requirements document
├── architecture.md         # System architecture
├── developer-guide.md      # Developer handbook
├── epics/                  # Feature epics (to be added)
├── stories/                # User stories (to be added)
├── qa/                     # QA documentation
│   ├── assessments/        # QA assessments
│   └── gates/              # Quality gates
└── architecture/           # Detailed architecture docs
```

## 🎯 Quick Start Guides

### For New Developers
1. Read the [Project Brief](./project-brief.md) to understand the project
2. Review the [Architecture Document](./architecture.md) for technical overview
3. Follow the [Developer Guide](./developer-guide.md) to set up your environment
4. Check the main [README.md](../README.md) for quick commands

### For Product Managers
1. Start with the [Project Brief](./project-brief.md)
2. Review the [PRD](./prd.md) for detailed requirements
3. Understand technical constraints from [Architecture Document](./architecture.md)

### For QA Engineers
1. Understand the product via [PRD](./prd.md)
2. Review test requirements in [Developer Guide](./developer-guide.md#9-testing)
3. Check quality gates in `qa/gates/` (to be populated)

## 📖 About BMAD Method

This project uses the **BMAD (Breakthrough Method for Agile AI-Driven Development)** framework for documentation organization. BMAD provides:

- **Modular Documentation**: Template-driven documents for each phase
- **Document Sharding**: Large documents broken into actionable pieces (epics, stories)
- **Role-Based Workflow**: Clear responsibilities (Analyst, PM, Architect, Dev, QA)
- **Version Control**: All documentation versioned and auditable
- **AI-Friendly**: Optimized for AI-assisted development workflows

### BMAD Structure Benefits

1. **Clarity**: Each document has a clear purpose and owner
2. **Traceability**: Requirements traced from PRD through architecture to implementation
3. **Scalability**: Easily handles complex projects through document sharding
4. **Consistency**: Standard templates ensure nothing is missed
5. **Efficiency**: Specialized agents/roles work on focused areas

### BMAD Installation

The BMAD framework is installed in the `.bmad-core` directory (excluded from git). To reinstall or update:

```bash
npx bmad-method install
```

For more information about BMAD:
- [BMAD GitHub Repository](https://github.com/bmadcode/BMAD-METHOD-v5)
- [BMAD User Guide](.bmad-core/user-guide.md) (local installation)
- [BMAD NPM Package](https://www.npmjs.com/package/bmad-method)

## 🔄 Documentation Workflow

### Planning Phase (Completed)
- [x] Create project brief
- [x] Define PRD with requirements
- [x] Document architecture
- [x] Create developer guide

### Development Phase (Ongoing)
- [ ] Create feature epics
- [ ] Break down into user stories
- [ ] Define QA gates
- [ ] Track implementation progress

### Maintenance Phase
- [ ] Update documentation as features evolve
- [ ] Maintain architecture decision records
- [ ] Keep developer guide current

## 📝 Contributing to Documentation

### Adding New Documentation

1. **Epics**: Add to `epics/` folder following template
2. **Stories**: Add to `stories/` folder with story ID
3. **QA Docs**: Add assessments and gates to `qa/` folders
4. **Architecture**: Add detailed docs to `architecture/` folder

### Documentation Standards

- **Format**: Markdown (.md)
- **Structure**: Clear headings, table of contents for long docs
- **Language**: Clear, concise, jargon-free where possible
- **Links**: Use relative links between docs
- **Updates**: Update version and date when modified

### Review Process

1. Create documentation
2. Self-review for clarity and completeness
3. Request peer review
4. Update based on feedback
5. Merge to main branch

## 🛠️ Tools & Resources

### Markdown Tools
- **VS Code**: Markdown All in One extension
- **Mermaid**: For diagrams (supported in GitHub)
- **Markdown Preview**: Real-time preview

### BMAD Tools
- **BMAD CLI**: `npx bmad-method [command]`
- **Agents**: Located in `.bmad-core/agents/`
- **Templates**: Located in `.bmad-core/templates/`

## 📞 Getting Help

### Documentation Questions
- Open an issue with label `documentation`
- Ask in team chat/discussions
- Contact the documentation owner

### Technical Questions
- Review [Developer Guide](./developer-guide.md)
- Check [Architecture Document](./architecture.md)
- Open an issue with label `question`

## 🗺️ Documentation Roadmap

### Short Term (Current Sprint)
- [ ] Create initial epics for core features
- [ ] Define user stories for MVP
- [ ] Set up QA assessment templates

### Medium Term (Next Quarter)
- [ ] Complete all epic documentation
- [ ] Populate story templates
- [ ] Establish QA gates for each feature
- [ ] Create deployment documentation

### Long Term (Ongoing)
- [ ] Maintain living documentation
- [ ] Add video tutorials
- [ ] Create interactive guides
- [ ] Build knowledge base

---

## Document Index

### Primary Documents
1. **[Project Brief](./project-brief.md)** - Project overview and business context
2. **[PRD](./prd.md)** - Product requirements and specifications
3. **[Architecture](./architecture.md)** - Technical architecture and design
4. **[Developer Guide](./developer-guide.md)** - Development handbook

### Supporting Documents
- **[Main README](../README.md)** - Repository root documentation
- **[CHANGELOG](../CHANGELOG.md)** - Version history and changes

### BMAD Resources (Local)
- **User Guide**: `.bmad-core/user-guide.md`
- **Agents**: `.bmad-core/agents/`
- **Templates**: `.bmad-core/templates/`
- **Workflows**: `.bmad-core/workflows/`

---

**Documentation Version**: 1.0
**Last Updated**: 2025-12-16
**Maintained By**: Project Team
**Review Cycle**: Monthly

For issues or suggestions about this documentation, please open a GitHub issue.
