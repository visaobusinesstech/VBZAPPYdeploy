import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import ModalImage from "react-modal-image";
import api from "../../services/api";
import { getBackendUrl } from "../../config";

const useStyles = makeStyles(theme => ({
	messageMedia: {
		objectFit: "cover",
		width: 250,
		height: "auto", // Redimensionar automaticamente a altura para manter a proporção
		borderTopLeftRadius: 8,
		borderTopRightRadius: 8,
		borderBottomLeftRadius: 8,
		borderBottomRightRadius: 8,
	}
}));

const ModalImageCors = ({ imageUrl }) => {
	const classes = useStyles();
	const [fetching, setFetching] = useState(true);
	const [blobUrl, setBlobUrl] = useState("");
	const backendUrl = getBackendUrl() || "http://localhost:8080";

	const resolveUrl = (url) => {
		if (!url || typeof url !== "string") return "";
		const u = url.trim();
		// URLs já utilizáveis diretamente pelo navegador
		if (/^(data:|blob:|https?:\/\/)/i.test(u)) return u;
		// Caminho absoluto do backend
		if (u.startsWith("/")) return `${backendUrl}${u}`;
		// Nome de arquivo relativo em /public
		return `${backendUrl}/public/${u}`;
	};

	useEffect(() => {
		if (!imageUrl) {
			setFetching(false);
			return;
		}
		const finalUrl = resolveUrl(imageUrl);
		// Se já é data/blob, usar diretamente
		if (/^(data:|blob:)/i.test(finalUrl)) {
			setBlobUrl(finalUrl);
			setFetching(false);
			return;
		}
		const fetchImage = async () => {
			try {
				const { data, headers } = await api.get(finalUrl, {
					responseType: "blob",
				});
				const url = window.URL.createObjectURL(
					new Blob([data], { type: headers["content-type"] || "image/*" })
				);
				setBlobUrl(url);
			} catch (e) {
				// Fallback: usar URL direto, evitando quebrar com "Invalid URL"
				setBlobUrl(finalUrl);
			} finally {
				setFetching(false);
			}
		};
		fetchImage();
	}, [imageUrl]);

	return (
		<ModalImage
			className={classes.messageMedia}
			smallSrcSet={fetching ? resolveUrl(imageUrl) : blobUrl}
			medium={fetching ? resolveUrl(imageUrl) : blobUrl}
			large={fetching ? resolveUrl(imageUrl) : blobUrl}
			alt="image"
			showRotate={true}
		/>
	);
};

export default ModalImageCors;
