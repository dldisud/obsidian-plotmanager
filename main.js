const { Plugin, ItemView, WorkspaceLeaf, PluginSettingTab, Setting, TFolder, Modal, Notice } = require('obsidian');

class PlotMasterPlugin extends Plugin {
    DEFAULT_SETTINGS = {
        worksFolder: 'Works',
        plotPointsFolder: 'PlotPoints',
        charactersFolder: 'Characters',
        tagFilter: '',
        showStatus: true,
        enableVisualization: false
    }

    async onload() {
        console.log('Loading PlotMaster Plugin');

        await this.loadSettings();

        await this.createFolderIfNotExists(this.settings.worksFolder);

        this.addRibbonIcon('book', 'PlotMaster', () => {
            this.activateView();
        });

        this.addCommand({
            id: 'create-work',
            name: 'Create new work',
            callback: () => this.createWork()
        });

        this.addCommand({
            id: 'create-plot-point',
            name: 'Create plot point',
            callback: () => this.createPlotPoint()
        });
        
        this.addCommand({
            id: 'create-character',
            name: 'Create character',
            callback: () => this.createCharacter()
        });

        this.registerView(
            'plotmaster-view',
            (leaf) => new PlotMasterView(leaf, this)
        );

        this.addSettingTab(new PlotMasterSettingTab(this.app, this));
    }

    async createFolderIfNotExists(folderPath) {
        const { vault } = this.app;
        if (!(await vault.adapter.exists(folderPath))) {
            await vault.createFolder(folderPath);
        }
    }

    async activateView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType('plotmaster-view')[0];
        if (!leaf) {
            leaf = workspace.getRightLeaf(false);
            await leaf.setViewState({ type: 'plotmaster-view' });
        }
        workspace.revealLeaf(leaf);
    }

    async createWork() {
        const workName = await this.promptForWorkName();
        if (!workName) return;

        const workFolder = `${this.settings.worksFolder}/${workName}`;
        await this.createFolderIfNotExists(workFolder);
        await this.createFolderIfNotExists(`${workFolder}/${this.settings.plotPointsFolder}`);
        await this.createFolderIfNotExists(`${workFolder}/${this.settings.charactersFolder}`);

        const workFile = await this.app.vault.create(
            `${workFolder}/${workName}.md`,
            '---\ntitle: ' + workName + '\nsummary: \ngenre: \n---\n\n'
        );
        this.app.workspace.activeLeaf.openFile(workFile);
    }

    async promptForWorkName() {
        const modal = new WorkNameModal(this.app);
        return new Promise((resolve) => {
            modal.onClose = () => resolve(modal.workName);
            modal.open();
        });
    }

    async createPlotPoint() {
        const workFolder = await this.selectWorkFolder();
        if (!workFolder) return;

        const plotPoint = await this.app.vault.create(
            `${workFolder}/${this.settings.plotPointsFolder}/${Date.now()}.md`,
            '---\ntitle: \nscene: \nstatus: planning\n---\n\n'
        );
        this.app.workspace.activeLeaf.openFile(plotPoint);
    }

    async createCharacter() {
        const workFolder = await this.selectWorkFolder();
        if (!workFolder) return;

        const workPath = typeof workFolder === 'string' ? workFolder : workFolder.path;

        const characterPath = `${workPath}/${this.settings.charactersFolder}/${Date.now()}.md`;
        const character = await this.app.vault.create(
            characterPath,
            '---\nname: \nrole: \nbackground: \npersonality: \n---\n\n'
        );
        this.app.workspace.activeLeaf.openFile(character);
    }

    async selectWorkFolder() {
        const worksFolder = this.app.vault.getAbstractFileByPath(this.settings.worksFolder);
        if (!(worksFolder instanceof TFolder)) {
            new Notice('Works folder not found');
            return null;
        }
    
        const works = worksFolder.children.filter(child => child instanceof TFolder);
        if (works.length === 0) {
            new Notice('No works found. Please create a work first.');
            return null;
        }
    
        const modal = new WorkSelectorModal(this.app, works);
        const selectedWork = await new Promise((resolve) => {
            modal.onClose = () => resolve(modal.selectedWork);
            modal.open();
        });
        
        return selectedWork ? selectedWork.path : null;
    }

    async loadSettings() {
        this.settings = Object.assign({}, this.DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    onunload() {
        console.log('Unloading PlotMaster Plugin');
    }
}

class PlotMasterView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return 'plotmaster';
    }

    getDisplayText() {
        return 'Plot Master';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();

        const worksEl = container.createEl('div');
        worksEl.createEl('h3', { text: 'Works' });
        const works = await this.getWorks();
        this.renderWorks(worksEl, works);

        if (this.plugin.settings.enableVisualization) {
            this.renderVisualization(container, works);
        }
    }

    async getWorks() {
        const worksFolder = this.app.vault.getAbstractFileByPath(this.plugin.settings.worksFolder);
        if (!(worksFolder instanceof TFolder)) return [];
        return worksFolder.children.filter(child => child instanceof TFolder);
    }

    renderWorks(containerEl, works) {
        const ul = containerEl.createEl('ul');
        for (let work of works) {
            const li = ul.createEl('li');
            const link = li.createEl('a', { text: work.name, href: work.path });
            link.addEventListener('click', (event) => {
                event.preventDefault();
                this.renderWorkDetails(containerEl, work);
            });
        }
    }

    async renderWorkDetails(containerEl, work) {
        containerEl.empty();
        containerEl.createEl('h3', { text: work.name });

        const plotPointsEl = containerEl.createEl('div');
        plotPointsEl.createEl('h4', { text: 'Plot points' });
        const plotPoints = await this.getPlotPoints(work);
        this.renderPlotPoints(plotPointsEl, plotPoints);

        const charactersEl = containerEl.createEl('div');
        charactersEl.createEl('h4', { text: 'Characters' });
        const characters = await this.getCharacters(work);
        this.renderCharacters(charactersEl, characters);

        if (this.plugin.settings.enableVisualization) {
            this.renderVisualization(containerEl, [work]);
        }
    }

    async getPlotPoints(work) {
        const plotPointsFolder = work.children.find(child => child.name === this.plugin.settings.plotPointsFolder);
        if (!(plotPointsFolder instanceof TFolder)) return [];
        let plotPoints = plotPointsFolder.children;
        if (this.plugin.settings.tagFilter) {
            const tags = this.plugin.settings.tagFilter.split(',').map(tag => tag.trim());
            plotPoints = await this.filterFilesByTags(plotPoints, tags);
        }
        return plotPoints;
    }

    async getCharacters(work) {
        const charactersFolder = work.children.find(child => child.name === this.plugin.settings.charactersFolder);
        if (!(charactersFolder instanceof TFolder)) return [];
        let characters = charactersFolder.children;
        if (this.plugin.settings.tagFilter) {
            const tags = this.plugin.settings.tagFilter.split(',').map(tag => tag.trim());
            characters = await this.filterFilesByTags(characters, tags);
        }
        return characters;
    }

    async filterFilesByTags(files, tags) {
        const filteredFiles = [];
        for (const file of files) {
            const content = await this.app.vault.read(file);
            const fileTags = this.getTagsFromContent(content);
            if (tags.some(tag => fileTags.includes(tag))) {
                filteredFiles.push(file);
            }
        }
        return filteredFiles;
    }

    getTagsFromContent(content) {
        const frontmatter = this.app.metadataCache.getFileCache(content).frontmatter;
        return frontmatter && frontmatter.tags ? frontmatter.tags : [];
    }

    renderPlotPoints(containerEl, plotPoints) {
        const ul = containerEl.createEl('ul');
        for (let plot of plotPoints) {
            const li = ul.createEl('li');
            const link = li.createEl('a', { text: plot.basename, href: plot.path });
            
            if (this.plugin.settings.showStatus) {
                const status = this.getStatusFromFile(plot);
                li.createEl('span', { text: ` [${status}]`, cls: `status-${status}` });
            }

            link.addEventListener('click', (event) => {
                event.preventDefault();
                this.app.workspace.activeLeaf.openFile(plot);
            });
        }
    }

    renderCharacters(containerEl, characters) {
        const ul = containerEl.createEl('ul');
        for (let character of characters) {
            const li = ul.createEl('li');
            const link = li.createEl('a', { text: character.basename, href: character.path });
            link.addEventListener('click', (event) => {
                event.preventDefault();
                this.app.workspace.activeLeaf.openFile(character);
            });
        }
    }

    getStatusFromFile(file) {
        const cache = this.app.metadataCache.getFileCache(file);
        return cache && cache.frontmatter && cache.frontmatter.status ? cache.frontmatter.status : 'unknown';
    }

    renderVisualization(containerEl, works) {
        const visualizationEl = containerEl.createEl('div', { cls: 'plotmaster-visualization' });
        visualizationEl.createEl('h3', { text: 'Story visualization' });
    
        works.forEach(async (work) => {
            const workEl = visualizationEl.createEl('div', { cls: 'plotmaster-work-container' });
            
            const workHeader = workEl.createEl('div', { cls: 'plotmaster-work-header' });
            workHeader.createEl('h4', { text: work.name, cls: 'plotmaster-work-title' });
    
            const contentEl = workEl.createEl('div', { cls: 'plotmaster-work-content' });
            
            const plotPointsEl = contentEl.createEl('div', { cls: 'plotmaster-column plotmaster-plotpoints' });
            plotPointsEl.createEl('h5', { text: 'Plot Points' });
            
            const charactersEl = contentEl.createEl('div', { cls: 'plotmaster-column plotmaster-characters' });
            charactersEl.createEl('h5', { text: 'Characters' });
    
            const plotPoints = await this.getPlotPoints(work);
            const characters = await this.getCharacters(work);
    
            plotPoints.forEach((plot) => {
                plotPointsEl.createEl('div', { 
                    cls: 'plotmaster-item plotmaster-plot',
                    text: plot.basename
                });
            });
    
            characters.forEach((character) => {
                charactersEl.createEl('div', { 
                    cls: 'plotmaster-item plotmaster-character',
                    text: character.basename
                });
            });
        });
    
        this.addImprovedVisualizationStyles();
    }
    
    addImprovedVisualizationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .plotmaster-visualization {
                margin-top: 20px;
                border: 1px solid var(--background-modifier-border);
                padding: 10px;
                background-color: var(--background-secondary);
            }
            .plotmaster-work-container {
                margin-bottom: 30px;
                padding: 10px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 5px;
            }
            .plotmaster-work-header {
                text-align: center;
                margin-bottom: 20px;
            }
            .plotmaster-work-title {
                font-weight: bold;
            }
            .plotmaster-work-content {
                display: flex;
                justify-content: space-between;
            }
            .plotmaster-column {
                width: 48%;
            }
            .plotmaster-column h5 {
                text-align: center;
                margin-bottom: 10px;
            }
            .plotmaster-item {
                padding: 5px 10px;
                margin: 5px 0;
                background-color: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 5px;
            }
        `;
        document.head.appendChild(style);
    }

    async onClose() {
        // Nothing to clean up.
    }
}

class PlotMasterSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        let { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Works folder')
            .setDesc('Folder path for works')
            .addText(text => text
                .setPlaceholder('Works')
                .setValue(this.plugin.settings.worksFolder)
                .onChange(async (value) => {
                    this.plugin.settings.worksFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Plot points folder')
            .setDesc('Folder name for plot points within each work')
            .addText(text => text
                .setPlaceholder('PlotPoints')
                .setValue(this.plugin.settings.plotPointsFolder)
                .onChange(async (value) => {
                    this.plugin.settings.plotPointsFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Characters folder')
            .setDesc('Folder name for characters within each work')
            .addText(text => text
                .setPlaceholder('Characters')
                .setValue(this.plugin.settings.charactersFolder)
                .onChange(async (value) => {
                    this.plugin.settings.charactersFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Tag filter')
            .setDesc('Filter plot points and characters by tag (leave empty for no filter)')
            .addText(text => text
                .setPlaceholder('tag1, tag2')
                .setValue(this.plugin.settings.tagFilter)
                .onChange(async (value) => {
                    this.plugin.settings.tagFilter = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show status')
            .setDesc('Show status indicators for plot points')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showStatus)
                .onChange(async (value) => {
                    this.plugin.settings.showStatus = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Enable visualization')
            .setDesc('Enable graph visualization for works, plot points, and characters')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableVisualization)
                .onChange(async (value) => {
                    this.plugin.settings.enableVisualization = value;
                    await this.plugin.saveSettings();
                }));
    }
}

class WorkNameModal extends Modal {
    constructor(app) {
        super(app);
        this.workName = null;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Enter work name' });
        const input = contentEl.createEl('input', { type: 'text' });
        const submitButton = contentEl.createEl('button', { text: 'Create' });
        submitButton.addEventListener('click', () => {
            this.workName = input.value;
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class WorkSelectorModal extends Modal {
    constructor(app, works) {
        super(app);
        this.works = works;
        this.selectedWork = null;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Select work' });
        const select = contentEl.createEl('select');
        this.works.forEach(work => {
            select.createEl('option', { text: work.name, value: work.path });
        });
        const submitButton = contentEl.createEl('button', { text: 'Select' });
        submitButton.addEventListener('click', () => {
            this.selectedWork = this.works.find(work => work.path === select.value);
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

module.exports = PlotMasterPlugin;
