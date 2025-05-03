import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import axios from "axios";

type BookInfo = {
  author_key?: string[];
  author_name?: string[];
  cover_edition_key?: string;
  cover_i?: number;
  ebook_access?: string;
  edition_count?: number;
  first_publish_year?: number;
  has_fulltext?: boolean;
  ia?: string[];
  ia_collection_s?: string;
  key?: string;
  language?: string[];
  lending_edition_s?: string;
  lending_identifier_s?: string;
  public_scan_b?: boolean;
  title?: string;
};

const getPdf = async (bookUrl: string): Promise<BookInfo | null> => {
  try {
    const getPdfData = await axios.get(bookUrl);
    const pdfData: BookInfo[] = getPdfData.data.docs.filter(
      (data: BookInfo) => data.ebook_access === "public"
    );
    console.log(pdfData);
    if (pdfData.length === 0) return null;

    const originalPdf = pdfData.reduce(
      (max: BookInfo, obj: BookInfo) =>
        (obj.edition_count ?? 0) > (max.edition_count ?? 0) ? obj : max,
      {} as BookInfo
    );
    //@ts-ignore
    const pdfUrl = `https://archive.org/download/${originalPdf.ia[0]}/${originalPdf.ia[0]}.pdf`;

    return originalPdf;
  } catch (error) {
    console.error("Error fetching PDF data:", error);
    return null;
  }
};

export default getPdf;
