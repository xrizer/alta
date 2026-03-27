import { DELAY, LIMIT_DEFAULT, PAGE_DEFAULT } from "@/constants/list.constant";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import useDebounce from "./useDebounce";
import { ChangeEvent } from "react";

const useChangeUrl = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const debounce = useDebounce();

    const currentLimit = searchParams.get("limit") || LIMIT_DEFAULT;
    const currentPage = searchParams.get("page") || PAGE_DEFAULT;
    const currentSearch = searchParams.get("search") || "";
    const currentCategory = searchParams.get("category") || "";
    const currentIsOnline = searchParams.get("isOnline") || "";
    const currentIsFeatured = searchParams.get("isFeatured") || "";

    const createQueryString = (params: Record<string, string | number>) => {
        const newParams = new URLSearchParams(searchParams.toString());

        Object.entries(params).forEach(([key, value]) => {
            if (value === "" || value === undefined) {
                newParams.delete(key);
            } else {
                newParams.set(key, String(value));
            }
        });

        return newParams.toString();
    };

    const setUrl = () => {
        router.replace(
            `${pathname}?${createQueryString({
                limit: currentLimit,
                page: currentPage,
                search: currentSearch,
            })}`
        );
    };

    const setUrlExplore = () => {
        router.replace(
            `${pathname}?${createQueryString({
                limit: currentLimit,
                page: currentPage,
                category: currentCategory,
                isOnline: currentIsOnline,
                isFeatured: currentIsFeatured,
            })}`
        );
    };

    const handleChangePage = (page: number) => {
        router.push(
            `${pathname}?${createQueryString({
                page,
            })}`
        );
    };

    const handleChangeLimit = (limit: string) => {
        router.push(
            `${pathname}?${createQueryString({
                limit,
                page: PAGE_DEFAULT,
            })}`
        );
    };

    const handleChangeCategory = (category: string) => {
        router.push(
            `${pathname}?${createQueryString({
                category,
                page: PAGE_DEFAULT,
            })}`
        );
    };

    const handleChangeIsOnline = (isOnline: string) => {
        router.push(
            `${pathname}?${createQueryString({
                isOnline,
                page: PAGE_DEFAULT,
            })}`
        );
    };

    const handleChangeIsFeatured = (isFeatured: string) => {
        router.push(
            `${pathname}?${createQueryString({
                isFeatured,
                page: PAGE_DEFAULT,
            })}`
        );
    };

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        debounce(() => {
            router.push(
                `${pathname}?${createQueryString({
                    search: value,
                    page: PAGE_DEFAULT,
                })}`
            );
        }, DELAY);
    };

    const handleClearSearch = () => {
        router.push(
            `${pathname}?${createQueryString({
                search: "",
                page: PAGE_DEFAULT,
            })}`
        );
    };

    return {
        currentLimit,
        currentPage,
        currentSearch,

        setUrl,
        handleChangePage,
        handleChangeLimit,
        handleSearch,
        handleClearSearch,

        setUrlExplore,
        currentCategory,
        currentIsFeatured,
        currentIsOnline,
        handleChangeCategory,
        handleChangeIsFeatured,
        handleChangeIsOnline,
    };
};

export default useChangeUrl;