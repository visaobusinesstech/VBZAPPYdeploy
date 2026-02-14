import { useState, useEffect } from "react";
import toastError from "../../errors/toastError";
import emailService from "../../services/emailService";

const useEmail = ({ searchParam, pageNumber }) => {
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [emails, setEmails] = useState([]);
    const [count, setCount] = useState(0);

    useEffect(() => {
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            const fetchEmails = async () => {
                try {
                    const data = await emailService.list({
                        searchParam,
                        pageNumber,
                    });
                    setEmails(data.emails || []);
                    setHasMore(data.hasMore);
                    setCount(data.count);
                    setLoading(false);
                } catch (err) {
                    setLoading(false);
                    toastError(err);
                }
            };

            fetchEmails();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchParam, pageNumber]);

    return { emails, loading, hasMore, count };
};

export default useEmail;
