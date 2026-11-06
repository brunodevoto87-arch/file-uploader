const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function getFolders(req, res, next) {
	try {
		const folders = await prisma.folder.findMany({
			where: { userId: req.user.id },
			orderBy: { id: "desc" },
		});
		res.render("index", { user: req.user, folders });
	} catch (err) {
		next(err);
	}
}

function getNewFolderForm(req, res) {
	res.render("new-folders");
}

async function createFolder(req, res, next) {
	try {
		const name = req.body.folderName?.trim();
		if (!name) {
			return res.redirect("/folders/new");
		}

		await prisma.folder.create({
			data: {
				name,
				userId: req.user.id,
			},
		});
		res.redirect("/folders");
	} catch (err) {
		next(err);
	}
}

async function deleteFolder(req, res, next) {
	try {
		const id = Number(req.params.id);
		if (Number.isInteger(id)) {
			await prisma.folder.deleteMany({
				where: { id, userId: req.user.id },
			});
		}
		res.redirect("/folders");
	} catch (err) {
		next(err);
	}
}
async function getFolderDetails(req, res, next) {
	try {
		const folderId = Number(req.params.id);
		if (!Number.isInteger(folderId)) return res.redirect("/folders");

		const folder = await prisma.folder.findUnique({
			where: { id: folderId },
			include: { files: true },
		});
		if (!folder || folder.userId !== req.user.id) {
			return res.redirect("/folders");
		}
		res.render("folder-details", { user: req.user, folder });
	} catch (err) {
		next(err);
	}
}

module.exports = {
	getFolders,
	getNewFolderForm,
	createFolder,
	deleteFolder,
	getFolderDetails,
};
