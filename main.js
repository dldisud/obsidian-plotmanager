const { Plugin, ItemView, WorkspaceLeaf, PluginSettingTab, Setting } = require('obsidian');

class PlotMasterPlugin extends Plugin {
    DEFAULT_SETTINGS = {
        plotPointsFolder: 'PlotPoints',
        charactersFolder: 'Characters',
        tagFilter: '',
        showStatus: true,
        enableVisualization: false
    }

    async onload() {
        console.log('Loading PlotMaster Plugin');

        await this.loadSettings();

        await this.createFolderIfNotExists(this.settings.plotPointsFolder);
        await this.createFolderIfNotExists(this.settings.charactersFolder);

        this.addRibbonIcon('book', 'PlotMaster', () => {
            this.activateView();
        });

        this.addCommand({
            id: 'create-plot-point',
            name: 'Create Plot Point',
            callback: () => this.createPlotPoint()
        });

        this.addCommand({
            id: 'create-character',
            name: 'Create Character',
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

    async createPlotPoint() {
        await this.createFolderIfNotExists(this.settings.plotPointsFolder);
        const plotPoint = await this.app.vault.create(
            `${this.settings.plotPointsFolder}/${Date.now()}.md`,
            '---\ntitle: \nscene: \nstatus: planning\n---\n\n'
        );
        this.app.workspace.activeLeaf.openFile(plotPoint);
    }

    async createCharacter() {
        await this.createFolderIfNotExists(this.settings.charactersFolder);
        const character = await this.app.vault.create(
            `${this.settings.charactersFolder}/${Date.now()}.md`,
            '---\nname: \nrole: \nbackground: \npersonality: \n---\n\n'
        );
        this.app.workspace.activeLeaf.openFile(character);
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
        return 'plotmaster-view';
    }

    getDisplayText() {
        return 'Plot Master';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();

        const plotPointsEl = container.createEl('div');
        plotPointsEl.createEl('h3', { text: 'Plot Points' });
        const plotPoints = await this.getPlotPoints();
        this.renderPlotPoints(plotPointsEl, plotPoints);

        const charactersEl = container.createEl('div');
        charactersEl.createEl('h3', { text: 'Characters' });
        const characters = await this.getCharacters();
        this.renderCharacters(charactersEl, characters);

        if (this.plugin.settings.enableVisualization) {
            this.renderVisualization(container, plotPoints, characters);
        }
    }

    async getPlotPoints() {
        const files = this.app.vault.getFiles();
        let plotPoints = files.filter(file => file.path.startsWith(this.plugin.settings.plotPointsFolder + '/'));
        if (this.plugin.settings.tagFilter) {
            const tags = this.plugin.settings.tagFilter.split(',').map(tag => tag.trim());
            plotPoints = await this.filterFilesByTags(plotPoints, tags);
        }
        return plotPoints;
    }

    async getCharacters() {
        const files = this.app.vault.getFiles();
        let characters = files.filter(file => file.path.startsWith(this.plugin.settings.charactersFolder + '/'));
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

    renderVisualization(containerEl, plotPoints, characters) {
        const visualizationEl = containerEl.createEl('div', { cls: 'plotmaster-visualization' });
        visualizationEl.createEl('h3', { text: 'Story Visualization' });

        let mermaidDef = 'graph TD;\n';

        plotPoints.forEach(plot => {
            mermaidDef += `    ${plot.basename}[${plot.basename}];\n`;
        });

        characters.forEach(character => {
            mermaidDef += `    ${character.basename}((${character.basename}));\n`;
        });

        plotPoints.forEach((plot, index) => {
            if (index < plotPoints.length - 1) {
                mermaidDef += `    ${plot.basename} --> ${plotPoints[index + 1].basename};\n`;
            }
            if (index < characters.length) {
                mermaidDef += `    ${plot.basename} -.-> ${characters[index].basename};\n`;
            }
        });

        const mermaidEl = visualizationEl.createEl('pre', { cls: 'mermaid', text: mermaidDef });

        if (window.mermaid) {
            window.mermaid.init(undefined, mermaidEl);
        }
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
            .setName('Plot points folder')
            .setDesc('Folder path for plot points')
            .addText(text => text
                .setPlaceholder('PlotPoints')
                .setValue(this.plugin.settings.plotPointsFolder)
                .onChange(async (value) => {
                    this.plugin.settings.plotPointsFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Characters folder')
            .setDesc('Folder path for characters')
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
            .setDesc('Enable graph visualization for plot points and characters')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableVisualization)
                .onChange(async (value) => {
                    this.plugin.settings.enableVisualization = value;
                    await this.plugin.saveSettings();
                }));
    }
}

module.exports = PlotMasterPlugin;