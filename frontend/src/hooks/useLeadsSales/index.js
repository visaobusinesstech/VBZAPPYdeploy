import { useState, useEffect } from "react";
import toastError from "../../errors/toastError";
import leadsSalesService from "../../services/leadsSalesService";

const useLeadsSales = ({ searchParam, pageNumber, status, pipelineId, responsibleId, contactId, dateStart, dateEnd }) => {
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [leadsSales, setLeadsSales] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchLeadsSales = async () => {
        try {
          const data = await leadsSalesService.list({
            searchParam,
            pageNumber,
            status,
            pipelineId,
            responsibleId,
            contactId,
            dateStart,
            dateEnd
          });
          setLeadsSales(data.leads || []);
          setHasMore(data.hasMore);
          setCount(data.count);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };

      fetchLeadsSales();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, status, pipelineId, responsibleId, contactId, dateStart, dateEnd]);

  return { leadsSales, loading, hasMore, count };
};

export default useLeadsSales;
