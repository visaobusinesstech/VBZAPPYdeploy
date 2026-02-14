import { useState, useEffect } from "react";
import toastError from "../../errors/toastError";
import inventoryService from "../../services/inventoryService";

const useInventory = ({ searchParam, pageNumber }) => {
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [count, setCount] = useState(0);

    useEffect(() => {
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            const fetchInventory = async () => {
                try {
                    const data = await inventoryService.list({
                        searchParam,
                        pageNumber,
                    });
                    setInventory(data.inventory || []);
                    setHasMore(data.hasMore);
                    setCount(data.count);
                    setLoading(false);
                } catch (err) {
                    setLoading(false);
                    toastError(err);
                }
            };

            fetchInventory();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchParam, pageNumber]);

    return { inventory, loading, hasMore, count };
};

export default useInventory;
